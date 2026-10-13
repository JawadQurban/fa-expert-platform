using System.Net;
using System.Net.Sockets;
using System.Text;
using ExpertHub.Infrastructure.Notifications;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace ExpertHub.Api.Tests;

/// <summary>INT-04 over SMTP, against a minimal in-process SMTP server.</summary>
public sealed class SmtpEmailGatewayTests
{
    [Fact]
    public void Without_host_and_sender_the_gateway_is_off()
    {
        var gateway = Gateway(new() { ["Email:Host"] = "smtp.example.test" });
        Assert.False(gateway.IsConfigured);
    }

    [Fact]
    public async Task An_arabic_email_reaches_the_smtp_server_right_to_left()
    {
        using var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        var port = ((IPEndPoint)listener.LocalEndpoint).Port;
        var received = FakeSmtpAsync(listener);

        var gateway = Gateway(new()
        {
            ["Email:Host"] = "127.0.0.1",
            ["Email:Port"] = port.ToString(System.Globalization.CultureInfo.InvariantCulture),
            ["Email:From"] = "no-reply@example.test",
        });
        var result = await gateway.SendAsync(
            new EmailMessage("trainer@example.test", "تم استلام طلبك", "مرحبًا\nرقم الطلب <EH-1>", "ar"),
            CancellationToken.None);

        Assert.True(result.Succeeded, result.ErrorDetail);
        var data = await received;
        Assert.Contains("RCPT TO:<trainer@example.test>", data, StringComparison.Ordinal);
        Assert.Contains("MAIL FROM:<no-reply@example.test>", data, StringComparison.Ordinal);
        Assert.Contains("Subject: =?utf-8?", data, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task An_unreachable_server_is_a_recorded_failure_not_an_exception()
    {
        using var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        var port = ((IPEndPoint)listener.LocalEndpoint).Port;
        listener.Stop();

        var result = await Gateway(new()
        {
            ["Email:Host"] = "127.0.0.1",
            ["Email:Port"] = port.ToString(System.Globalization.CultureInfo.InvariantCulture),
            ["Email:From"] = "no-reply@example.test",
            ["Email:TimeoutSeconds"] = "5",
        }).SendAsync(new EmailMessage("a@example.test", "s", "b", "ar"), CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.StartsWith("SMTP send failed", result.ErrorDetail, StringComparison.Ordinal);
    }

    private static SmtpEmailGateway Gateway(Dictionary<string, string?> settings) =>
        new(new ConfigurationBuilder().AddInMemoryCollection(settings).Build(),
            NullLogger<SmtpEmailGateway>.Instance);

    /// <summary>Accepts one session and returns every line the client sent.</summary>
    private static async Task<string> FakeSmtpAsync(TcpListener listener)
    {
        using var client = await listener.AcceptTcpClientAsync();
        using var stream = client.GetStream();
        using var reader = new StreamReader(stream, Encoding.ASCII);
        using var writer = new StreamWriter(stream, Encoding.ASCII) { NewLine = "\r\n", AutoFlush = true };
        var log = new StringBuilder();
        await writer.WriteLineAsync("220 fake");
        var inData = false;
        while (await reader.ReadLineAsync() is { } line)
        {
            log.AppendLine(line);
            if (inData)
            {
                if (line == ".") { inData = false; await writer.WriteLineAsync("250 queued"); }
                continue;
            }
            var verb = line.Split(' ')[0].ToUpperInvariant();
            if (verb == "DATA") { inData = true; await writer.WriteLineAsync("354 go"); }
            else if (verb == "QUIT") { await writer.WriteLineAsync("221 bye"); break; }
            else await writer.WriteLineAsync("250 ok");
        }
        return log.ToString();
    }
}
