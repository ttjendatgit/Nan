using System.Net;
using Vifan.PrintTech.Domain.Enums;

namespace Vifan.PrintTech.Application.Emails;

/// <summary>The finished subject/HTML/plain-text for one quote-status email.</summary>
public class QuoteStatusEmailContent
{
    public string Subject { get; init; } = string.Empty;
    public string HtmlBody { get; init; } = string.Empty;
    public string PlainTextBody { get; init; } = string.Empty;
}

/// <summary>
/// Builds the two customer-facing quote-status emails. Pure and side-effect free so it can be
/// unit-tested without any infrastructure. Content is fixed business copy -- there is no
/// client-suppliable subject/body/HTML here, and InternalNote is never referenced. The only
/// dynamic, user-supplied value is the customer's display name, which is HTML-encoded before
/// being placed in the HTML body; every other string here is a developer-authored literal and
/// intentionally left unencoded (there is nothing user-controlled to escape).
///
/// HTML markup uses a table-based, fully inline-styled layout (no &lt;style&gt; block, no
/// external fonts/assets) for broad email-client compatibility, and a light, restrained "Nan"
/// palette: warm ivory page background, a white content card, deep navy text, and a thin gold
/// accent line used only as a divider -- never as a fill.
/// </summary>
public static class QuoteStatusEmailTemplateBuilder
{
    private const string ColorBrandNavy = "#08337D";
    private const string ColorTextPrimary = "#081426";
    private const string ColorTextMuted = "#4A74A7";
    private const string ColorBgIvory = "#F5F2EA";
    private const string ColorBgWarmWhite = "#FAFAF8";
    private const string ColorAccentGold = "#ECCA3E";
    private const string ColorBorderSoft = "rgba(8,51,125,0.12)";

    private const string CalloutText = "Vui lòng kiểm tra Zalo để tiếp tục trao đổi với Nan.";

    public static QuoteStatusEmailContent Build(QuoteEmailNotificationType type, string? customerName)
    {
        var displayName = string.IsNullOrWhiteSpace(customerName) ? "bạn" : customerName.Trim();

        return type switch
        {
            QuoteEmailNotificationType.Contacted => BuildContent(
                subject: "Nan đã liên hệ với bạn về yêu cầu báo giá",
                displayName: displayName,
                mainMessage: "Nan đã tiếp nhận yêu cầu báo giá của bạn và đội ngũ tư vấn đã liên hệ với bạn qua Zalo.",
                bullets:
                [
                    "Đội ngũ tư vấn Nan đã nhắn tin cho bạn qua Zalo.",
                    "Trao đổi thêm về sản phẩm, số lượng, thiết kế và mức giá phù hợp."
                ],
                thankYou: "Cảm ơn bạn đã quan tâm đến Nan."),

            QuoteEmailNotificationType.Quoted => BuildContent(
                subject: "Nan đã gửi thông tin báo giá cho bạn",
                displayName: displayName,
                mainMessage: "Nan đã gửi thông tin báo giá cho yêu cầu của bạn qua Zalo.",
                bullets:
                [
                    "Thông tin báo giá đã được gửi cho bạn qua Zalo.",
                    "Trao đổi thêm với Nan nếu cần điều chỉnh số lượng, thiết kế hoặc giá."
                ],
                thankYou: "Cảm ơn bạn đã lựa chọn Nan."),

            _ => throw new ArgumentOutOfRangeException(nameof(type), type, "Unsupported quote notification type.")
        };
    }

    private static QuoteStatusEmailContent BuildContent(
        string subject,
        string displayName,
        string mainMessage,
        IReadOnlyList<string> bullets,
        string thankYou)
    {
        var plainTextBody = string.Join("\n\n",
        [
            $"Xin chào {displayName},",
            mainMessage,
            string.Join("\n", bullets.Select(b => $"- {b}")),
            CalloutText,
            thankYou,
            "— Đội ngũ Nan"
        ]);

        var htmlBody = BuildHtml(subject, displayName, mainMessage, bullets, thankYou);

        return new QuoteStatusEmailContent
        {
            Subject = subject,
            PlainTextBody = plainTextBody,
            HtmlBody = htmlBody
        };
    }

    private static string BuildHtml(
        string subject,
        string displayName,
        string mainMessage,
        IReadOnlyList<string> bullets,
        string thankYou)
    {
        var encodedName = WebUtility.HtmlEncode(displayName);

        var bulletRows = string.Concat(bullets.Select(bullet =>
            "<tr>" +
            $"<td style=\"padding:3px 8px 3px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:{ColorBrandNavy};vertical-align:top;\">&#8226;</td>" +
            $"<td style=\"padding:3px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:{ColorTextPrimary};\">{bullet}</td>" +
            "</tr>"));

        return
            "<!DOCTYPE html>" +
            "<html lang=\"vi\">" +
            "<head>" +
            "<meta charset=\"utf-8\" />" +
            "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />" +
            $"<title>{subject}</title>" +
            "</head>" +
            $"<body style=\"margin:0;padding:0;background-color:{ColorBgIvory};\">" +
            $"<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:{ColorBgIvory};\">" +
            "<tr><td align=\"center\" style=\"padding:24px 16px;\">" +
            $"<table role=\"presentation\" width=\"560\" cellpadding=\"0\" cellspacing=\"0\" style=\"width:100%;max-width:560px;background-color:#FFFFFF;border-radius:8px;\">" +

            // Header / brand mark
            "<tr>" +
            $"<td style=\"padding:28px 32px 16px 32px;text-align:center;border-bottom:2px solid {ColorAccentGold};\">" +
            $"<span style=\"font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:700;letter-spacing:3px;color:{ColorBrandNavy};\">NAN</span>" +
            "</td></tr>" +

            // Notification title
            "<tr><td style=\"padding:24px 32px 0 32px;\">" +
            $"<h1 style=\"margin:0;font-family:Arial,Helvetica,sans-serif;font-size:19px;font-weight:700;line-height:1.4;color:{ColorTextPrimary};\">{subject}</h1>" +
            "</td></tr>" +

            // Greeting + main message
            $"<tr><td style=\"padding:16px 32px 0 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:{ColorTextPrimary};\">" +
            $"<p style=\"margin:0 0 12px 0;\">Xin chào {encodedName},</p>" +
            $"<p style=\"margin:0;\">{mainMessage}</p>" +
            "</td></tr>" +

            // Bullet checklist
            "<tr><td style=\"padding:10px 32px 0 32px;\">" +
            $"<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\">{bulletRows}</table>" +
            "</td></tr>" +

            // Callout reminding the customer to check Zalo
            "<tr><td style=\"padding:20px 32px 0 32px;\">" +
            $"<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:{ColorBgWarmWhite};border-left:3px solid {ColorAccentGold};border-radius:4px;\">" +
            "<tr><td style=\"padding:14px 16px;\">" +
            $"<p style=\"margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:{ColorTextPrimary};\">{CalloutText}</p>" +
            "</td></tr></table>" +
            "</td></tr>" +

            // Footer
            $"<tr><td style=\"padding:24px 32px 28px 32px;\">" +
            $"<div style=\"border-top:1px solid {ColorBorderSoft};padding-top:16px;\">" +
            $"<p style=\"margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:{ColorTextMuted};\">{thankYou}</p>" +
            $"<p style=\"margin:6px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:{ColorTextMuted};\">— Đội ngũ Nan</p>" +
            "</div>" +
            "</td></tr>" +

            "</table>" +
            "</td></tr></table>" +
            "</body></html>";
    }
}
