import { Suite } from "@playwright/test/reporter";
import { MsTeamsReporterOptions } from ".";
import {
  createTableRow,
  getMentions,
  getNotificationBackground,
  getNotificationColor,
  getNotificationTitle,
  getTotalStatus,
  validateWebhookUrl,
} from "./utils";
import { BaseAdaptiveCard, BaseTable } from "./constants";

export const processResults = async (
  suite: Suite | undefined,
  options: MsTeamsReporterOptions
) => {
  if (!options.webhookUrl) {
    console.error("No webhook URL provided");
    return;
  }

  if (!validateWebhookUrl(options.webhookUrl, options.webhookType)) {
    console.error("Invalid webhook URL");
    return;
  }

  if (!suite) {
    console.error("No test suite found");
    return;
  }

  if (options.shouldRun && !options?.shouldRun(suite)) return;

  // Clone the base adaptive card and table
  const adaptiveCard = structuredClone(BaseAdaptiveCard);
  const table = structuredClone(BaseTable);

  const totalStatus = getTotalStatus(suite.suites);
  const totalTests = suite.allTests().length;
  const isSuccess = totalStatus.failed === 0;

  if (isSuccess && !options.notifyOnSuccess) {
    if (!options.quiet) {
      console.log("No failed tests, skipping notification");
    }
    return;
  }

  // Populate the table with test results
  table.rows.push(createTableRow("Type", "Total"));
  table.rows.push(createTableRow("✅ Passed", totalStatus.passed, { style: "good" }));
  if (totalStatus.flaky) {
    table.rows.push(createTableRow("⚠️ Flaky", totalStatus.flaky, { style: "warning" }));
  }
  table.rows.push(createTableRow("❌ Failed", totalStatus.failed, { style: "attention" }));
  table.rows.push(createTableRow("⏭️ Skipped", totalStatus.skipped, { style: "accent" }));
  table.rows.push(createTableRow("Total tests", totalTests, { isSubtle: true, weight: "Bolder" }));

  // Add the table to the card
  adaptiveCard.body.push({
    type: "Container",
    items: [
      {
        type: "TextBlock",
        size: "ExtraLarge",
        weight: "Bolder",
        text: options.title,
      },
      {
        type: "TextBlock",
        size: "Large",
        weight: "Bolder",
        text: getNotificationTitle(totalStatus),
        color: getNotificationColor(totalStatus),
      },
      table,
    ],
    bleed: true,
    backgroundImage: {
      url: getNotificationBackground(totalStatus),
      fillMode: "RepeatHorizontally",
    },
  });

  // Check if we should ping on failure
  if (!isSuccess) {
    const mentionData = getMentions(options.mentionOnFailure, options.mentionOnFailureText);
    if (mentionData?.message && mentionData.mentions.length > 0) {
      adaptiveCard.body.push({
        type: "TextBlock",
        size: "Medium",
        text: mentionData.message,
        wrap: true,
      });

      adaptiveCard.msteams.entities = mentionData.mentions.map((mention) => ({
        type: "mention",
        text: `<at>${mention.email}</at>`,
        mentioned: {
          id: mention.email,
          name: mention.name,
        },
      }));
    }
  }

  // Add action buttons
  if (options.linkToResultsUrl) {
    const linkToResultsUrl = typeof options.linkToResultsUrl === "string" ? options.linkToResultsUrl : options.linkToResultsUrl();
    if (linkToResultsUrl) {
      adaptiveCard.actions.push({
        type: "Action.OpenUrl",
        title: options.linkToResultsText,
        url: linkToResultsUrl,
      });
    }
  }

  if (!isSuccess && options.linkTextOnFailure && options.linkUrlOnFailure) {
    const linkUrlOnFailure = typeof options.linkUrlOnFailure === "string" ? options.linkUrlOnFailure : options.linkUrlOnFailure();
    if (linkUrlOnFailure) {
      adaptiveCard.actions.push({
        type: "Action.OpenUrl",
        title: options.linkTextOnFailure,
        url: linkUrlOnFailure,
      });
    }
  }

  if (options.webhookType === "powerautomate") {
    adaptiveCard.version = "1.4";
  }

  const body = JSON.stringify({
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: adaptiveCard,
      },
    ],
  });

  if (options.debug) {
    console.log("Sending the following message:");
    console.log(body);
  }

  const response = await fetch(options.webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });

  if (response.ok) {
    if (!options.quiet) {
      console.log("Message sent successfully");
      const responseText = await response.text();
      if (responseText !== "1") {
        console.log(responseText);
      }
    }
  } else {
    console.error("Failed to send message");
    console.error(await response.text());
  }
};