using System.Globalization;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace ExpertHub.Infrastructure.Screening;

/// <summary>
/// The external-LLM adapter behind <see cref="IAiAnalysisProvider"/> — one
/// class for both providers the owner named, because `P-132` makes the choice
/// configuration rather than a rewrite.
/// </summary>
/// <remarks>
/// <para>
/// ⚠️ <b>Ships dark.</b> `Q28` is the data-protection ruling on sending
/// applicant free-text outside the Academy's boundary, and it is unanswered —
/// so <see cref="IsConfigured"/> is false unless somebody deliberately sets
/// <c>Ai:ApiKey</c> and <c>Ai:Model</c> in the environment. Nothing here
/// activates by default, and `BR-0202` makes screening work unchanged with it
/// off.
/// </para>
/// <para>
/// Two request shapes are supported and nothing about them is inferred at
/// runtime: <c>anthropic</c> posts the Messages API's
/// <c>{model, max_tokens, messages}</c> with an <c>x-api-key</c> header and
/// reads <c>content[0].text</c>; <c>openai</c> posts Chat Completions'
/// <c>{model, messages}</c> with a bearer token and reads
/// <c>choices[0].message.content</c>. An in-Kingdom model that speaks either
/// shape needs only <c>Ai:Endpoint</c>.
/// </para>
/// <para>
/// <b>What is sent is only what the port allows.</b> This class receives
/// field codes and answer text and has no access to a name, an id or a
/// reference — see <see cref="IAiAnalysisProvider"/>. The prompt below adds
/// nothing but instructions.
/// </para>
/// </remarks>
public sealed partial class LlmAiAnalysisProvider : IAiAnalysisProvider
{
    /// <summary>Bumped whenever the prompt text changes — stored with every
    /// result, so an old analysis stays explainable.</summary>
    internal const string CurrentPromptVersion = "screening-qualitative.v1";

    private const string AnthropicDefaultEndpoint = "https://api.anthropic.com/v1/messages";
    private const string OpenAiDefaultEndpoint = "https://api.openai.com/v1/chat/completions";
    private const string AnthropicVersion = "2023-06-01";

    private static readonly JsonSerializerOptions ResponseJson = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _http;
    private readonly string _provider;
    private readonly string _model;
    private readonly string _apiKey;
    private readonly string _endpoint;
    private readonly int _maxTokens;
    private readonly ILogger _logger;

    public LlmAiAnalysisProvider(
        HttpClient http, IConfiguration configuration, ILogger<LlmAiAnalysisProvider>? logger = null)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        _http = http;
        _logger = logger ?? NullLogger<LlmAiAnalysisProvider>.Instance;
        _provider = (configuration["Ai:Provider"] ?? "anthropic").Trim().ToLowerInvariant();
        _model = configuration["Ai:Model"]?.Trim() ?? string.Empty;
        _apiKey = configuration["Ai:ApiKey"]?.Trim() ?? string.Empty;
        _maxTokens = configuration.GetValue("Ai:MaxTokens", 1024);
        var endpoint = configuration["Ai:Endpoint"]?.Trim();
        _endpoint = string.IsNullOrEmpty(endpoint)
            ? _provider == "openai" ? OpenAiDefaultEndpoint : AnthropicDefaultEndpoint
            : endpoint;
    }

    /// <summary>Both a key and a model, deliberately: a half-configured
    /// provider is off, not guessing at a default model.</summary>
    public bool IsConfigured => _apiKey.Length > 0 && _model.Length > 0;

    public async Task<AiAnalysisDraft?> AnalyzeAsync(
        IReadOnlyList<QualitativeAnswer> answers,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(answers);
        if (!IsConfigured || answers.Count == 0)
        {
            return null;
        }

        using var request = BuildRequest(Prompt(answers));
        using var response = await _http.SendAsync(request, cancellationToken).ConfigureAwait(false);
        ThrowIfTransient(response);
        if (!response.IsSuccessStatusCode)
        {
            // A refusal that a retry will not fix — a wrong key (401), a model
            // the account cannot use (404), a bad request (400). The provider's
            // own message says which; it carries no credential.
            LogRefused(_logger, (int)response.StatusCode,
                Truncate(await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false)));
            return null;
        }

        var body = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken)
            .ConfigureAwait(false);
        var parsed = ExtractText(body) is { } text ? ParseAnalysis(text) : null;
        if (parsed is null)
        {
            LogEmpty(_logger, "screening analysis");
        }
        return parsed is null
            ? null
            : new AiAnalysisDraft(
                parsed.SummaryAr ?? string.Empty,
                parsed.SummaryEn ?? string.Empty,
                JsonSerializer.Serialize(
                    new
                    {
                        strengths = parsed.Strengths ?? [],
                        considerations = parsed.Considerations ?? [],
                    },
                    AiAnalysisRequest.PayloadOptions),
                parsed.AdvisoryScore,
                _provider,
                _model,
                CurrentPromptVersion);
    }

    public async Task<string?> DraftBioAsync(
        string cvText, string language, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(cvText);
        if (!IsConfigured)
        {
            return null;
        }

        using var request = BuildRequest(
            (language == "en" ? BioInstructionsEn : BioInstructionsAr) + cvText);
        using var response = await _http.SendAsync(request, cancellationToken).ConfigureAwait(false);
        ThrowIfTransient(response);
        if (!response.IsSuccessStatusCode)
        {
            // A refusal that a retry will not fix — a wrong key (401), a model
            // the account cannot use (404), a bad request (400). The provider's
            // own message says which; it carries no credential.
            LogRefused(_logger, (int)response.StatusCode,
                Truncate(await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false)));
            return null;
        }
        var body = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken)
            .ConfigureAwait(false);
        var text = ExtractText(body)?.Trim().Trim('"', '«', '»').Trim();
        if (string.IsNullOrWhiteSpace(text))
        {
            LogEmpty(_logger, "bio");
            return null;
        }
        // A model that ignores the length asked for is clipped, never rejected:
        // the trainer edits it anyway.
        return text.Length <= BioMaxLength ? text : text[..BioMaxLength].TrimEnd();
    }

    /// <summary>Matches `TRAINER_BIO.draft`'s column length.</summary>
    private const int BioMaxLength = 600;

    private const string BioInstructionsAr = """
        أنت تساعد أكاديمية تدريب في كتابة نبذة مختصرة عن مدرب، تُعرض في دليل
        المدربين العام بعد أن يراجعها المدرب ويعتمدها موظف الأكاديمية.

        اكتب من السيرة الذاتية أدناه نبذة باللغة العربية الفصحى، بصيغة الغائب، في
        جملتين إلى ثلاث جمل ولا تتجاوز ٤٠٠ حرف: مجال الخبرة، وأبرز المؤهلات، ونوع
        التدريب أو الاستشارات التي يقدمها.

        لا تذكر رقم هاتف أو بريدًا إلكترونيًا أو عنوانًا أو رقم هوية أو تاريخ
        ميلاد. لا تخترع معلومة غير موجودة في السيرة. أجب بنص النبذة فقط، دون
        عنوان ودون علامات تنسيق.

        السيرة الذاتية:

        """;

    private const string BioInstructionsEn = """
        You are helping a training academy write a short bio of a trainer, shown
        in its public trainer directory after the trainer reviews it and Academy
        staff approve it.

        From the CV below, write the bio in English, in the third person, in two
        to three sentences and no more than 400 characters: the field of
        expertise, the main qualifications, and the kind of training or
        consulting they deliver.

        Do not include a phone number, email address, postal address, ID number
        or date of birth. Do not invent anything the CV does not say. Reply with
        the bio text only, with no heading and no formatting.

        CV:

        """;

    /// <summary>
    /// A rate limit (429) or a provider fault (5xx) is a FAILED DELIVERY, so the
    /// outbox retries it with backoff. Returning null would record it as
    /// «unavailable» and lose the result to a passing spike. Any other refusal
    /// (a bad key, a bad request) is not going to improve with a retry.
    /// </summary>
    private static void ThrowIfTransient(HttpResponseMessage response)
    {
        var status = (int)response.StatusCode;
        if (status == 429 || status >= 500)
        {
            throw new HttpRequestException(
                $"The AI provider answered {status}; the outbox will retry.",
                null,
                response.StatusCode);
        }
    }

    private static string Truncate(string value) =>
        value.Length <= 300 ? value : value[..300] + "…";

    [LoggerMessage(EventId = 5240, Level = LogLevel.Warning,
        Message = "AI provider refused the request ({Status}): {Detail}")]
    private static partial void LogRefused(ILogger logger, int status, string detail);

    [LoggerMessage(EventId = 5241, Level = LogLevel.Warning,
        Message = "AI provider answered with nothing usable for the {Use}.")]
    private static partial void LogEmpty(ILogger logger, string use);

    private HttpRequestMessage BuildRequest(string prompt)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, _endpoint);
        if (_provider == "openai")
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            request.Content = JsonContent.Create(new
            {
                model = _model,
                messages = new[] { new { role = "user", content = prompt } },
            });
            return request;
        }

        request.Headers.Add("x-api-key", _apiKey);
        request.Headers.Add("anthropic-version", AnthropicVersion);
        request.Content = JsonContent.Create(new
        {
            model = _model,
            max_tokens = _maxTokens,
            messages = new[] { new { role = "user", content = prompt } },
        });
        return request;
    }

    private static string? ExtractText(JsonElement body)
    {
        // Anthropic: content[0].text
        if (body.TryGetProperty("content", out var content)
            && content.ValueKind == JsonValueKind.Array
            && content.GetArrayLength() > 0
            && content[0].TryGetProperty("text", out var anthropicText))
        {
            return anthropicText.GetString();
        }
        // OpenAI: choices[0].message.content
        if (body.TryGetProperty("choices", out var choices)
            && choices.ValueKind == JsonValueKind.Array
            && choices.GetArrayLength() > 0
            && choices[0].TryGetProperty("message", out var msg)
            && msg.TryGetProperty("content", out var openAiText))
        {
            return openAiText.GetString();
        }
        return null;
    }

    /// <summary>
    /// Reads the model's JSON, tolerating the fence some models wrap it in.
    /// Anything unreadable is <c>null</c> — which the channel records as
    /// <c>unavailable</c>, never as an empty analysis.
    /// </summary>
    private static AiAnalysisResponse? ParseAnalysis(string text)
    {
        var start = text.IndexOf('{', StringComparison.Ordinal);
        var end = text.LastIndexOf('}');
        if (start < 0 || end <= start)
        {
            return null;
        }
        try
        {
            return JsonSerializer.Deserialize<AiAnalysisResponse>(
                text[start..(end + 1)], ResponseJson);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    /// <summary>
    /// The prompt, in one place and versioned. It carries the answers and the
    /// output contract — and, deliberately, no instruction that would need an
    /// identity to follow.
    /// </summary>
    private static string Prompt(IReadOnlyList<QualitativeAnswer> answers)
    {
        var body = string.Join(
            "\n\n",
            answers.Select(a => string.Create(
                CultureInfo.InvariantCulture, $"[{a.FieldCode}]\n{a.Text}")));

        return Instructions + body;
    }

    /// <summary>
    /// The instruction half of the prompt — a plain constant, so the text a
    /// model was given is readable here without interpolation getting in the
    /// way. Change it and bump <see cref="CurrentPromptVersion"/>.
    /// </summary>
    private const string Instructions = """
        You are assisting a training academy's screening staff. Below are an
        applicant's free-text answers to qualitative questions. You are given
        no name, identifier or contact detail, and you must not ask for any.

        Write a short advisory reading of the answers: what they demonstrate
        well, and what a screener may want to probe. Your output is advisory
        only and is never combined with the official score.

        Reply with JSON and nothing else, in exactly this shape:
        {"summaryAr":"…","summaryEn":"…",
         "strengths":[{"ar":"…","en":"…"}],
         "considerations":[{"ar":"…","en":"…"}],
         "advisoryScore":0-100 or null}

        Write summaryAr and the "ar" fields in Arabic, summaryEn and the "en"
        fields in English. Use null for advisoryScore if the answers do not
        support a number.

        Answers:

        """;
}
