using System.Net;
using System.Text;
using System.Text.Json;
using ExpertHub.Infrastructure.Notifications;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace ExpertHub.Api.Tests;

/// <summary>INT-04 through the Notifications Gateway, against a recorded handler.</summary>
public sealed class NotificationsGatewayEmailTests
{
    private static readonly Dictionary<string, string?> Configured = new()
    {
        ["Email:GatewayUrl"] = "https://notifications.example.test/",
        ["Email:Username"] = "expert-hub",
        ["Email:Password"] = "test-only",
    };

    [Fact]
    public void Without_the_password_the_gateway_is_off()
    {
        var settings = new Dictionary<string, string?>(Configured) { ["Email:Password"] = null };
        Assert.False(Gateway(new Recorder(HttpStatusCode.OK), settings).IsConfigured);
    }

    [Fact]
    public async Task An_arabic_email_is_posted_to_NotifyByEmail_with_basic_auth_right_to_left()
    {
        var recorder = new Recorder(HttpStatusCode.OK);
        var result = await Gateway(recorder, Configured).SendAsync(
            new EmailMessage("trainer@example.test", "تم استلام طلبك", "مرحبًا\nرقم الطلب <EH-1>", "ar"),
            CancellationToken.None);

        Assert.True(result.Succeeded, result.ErrorDetail);
        Assert.Equal("https://notifications.example.test/api/v1/Notifications/NotifyByEmail",
            recorder.Uri!.ToString());
        Assert.Equal("Basic " + Convert.ToBase64String(Encoding.UTF8.GetBytes("expert-hub:test-only")),
            recorder.Authorization);
        using var body = JsonDocument.Parse(recorder.Body!);
        Assert.Equal("trainer@example.test", body.RootElement.GetProperty("toReceiver").GetString());
        Assert.Equal("تم استلام طلبك", body.RootElement.GetProperty("subject").GetString());
        var html = body.RootElement.GetProperty("htmlMessage").GetString()!;
        Assert.Contains("dir=\"rtl\"", html, StringComparison.Ordinal);
        Assert.Contains("مرحبًا<br>رقم الطلب &lt;EH-1&gt;", html, StringComparison.Ordinal);
        // The Academy's unified layout, in the recipient's direction.
        Assert.Contains("Unified/v1/EmailHeader.jpg", html, StringComparison.Ordinal);
        Assert.Contains("Unified/v1/EmailFooter.jpg", html, StringComparison.Ordinal);
        Assert.Contains("direction: rtl;", html, StringComparison.Ordinal);
        Assert.DoesNotContain("{dir}", html, StringComparison.Ordinal);
        Assert.DoesNotContain("{Body}", html, StringComparison.Ordinal);
    }

    [Fact]
    public async Task A_refusal_is_a_recorded_failure_not_an_exception()
    {
        var result = await Gateway(new Recorder(HttpStatusCode.Unauthorized), Configured).SendAsync(
            new EmailMessage("a@example.test", "s", "b", "ar"), CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.Equal("Notifications Gateway answered 401.", result.ErrorDetail);
    }

    private static NotificationsGatewayEmail Gateway(Recorder recorder, Dictionary<string, string?> settings) =>
        new(new HttpClient(recorder),
            new ConfigurationBuilder().AddInMemoryCollection(settings).Build(),
            NullLogger<NotificationsGatewayEmail>.Instance);

    private sealed class Recorder(HttpStatusCode status) : HttpMessageHandler
    {
        public Uri? Uri { get; private set; }
        public string? Authorization { get; private set; }
        public string? Body { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Uri = request.RequestUri;
            Authorization = request.Headers.Authorization?.ToString();
            Body = request.Content is null ? null : await request.Content.ReadAsStringAsync(cancellationToken);
            return new HttpResponseMessage(status);
        }
    }
}
