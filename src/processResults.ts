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
import * as fs from 'fs';
import * as path from 'path';
import QuickChart from 'quickchart-js';

// Function to generate the donut chart
function generateDonutChart(passed: number, failed: number, skipped: number, flaky: number): string {
    const chart = new QuickChart();
    chart.setConfig({
      type: 'outlabeledPie',
      data: {
        labels: ['Passed', 'Failed', 'Skipped', 'Flaky'],
        datasets: [{
          backgroundColor: ['#4CAF50', '#F44336', '#8f8f8f', '#FF9800'],
          data: [passed, failed, skipped, flaky]
        }]
      },
      options: {
        plugins: {
          legend: false,
          outlabels: {
            text: '%l %p',
            color: 'black',
            stretch: 35,
            font: {
              resizable: true,
              minSize: 12,
              maxSize: 18
            }
          }
        }
      }
    });
    return chart.getUrl();
  }

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

  // Dynamically determine the report path
  const reportPath = path.join(process.cwd(), 'ctrf', 'ctrf-report.json');
  const report = readCtrfReport(reportPath);
  const testResults = extractTestResults(report);
  const totalStatus = getTotalStatus(suite.suites);
  const totalTests = suite.allTests().length;
  const isSuccess = totalStatus.failed === 0;

  if (isSuccess && !options.notifyOnSuccess) {
    if (!options.quiet) {
      console.log("No failed tests, skipping notification");
    }
    return;
  }

  // Generate the donut chart
  const donutChartUrl = generateDonutChart(totalStatus.passed, totalStatus.failed, totalStatus.skipped, totalStatus.flaky);

  // Clone the base adaptive card and table
  const adaptiveCard = structuredClone(BaseAdaptiveCard);
  const table = structuredClone(BaseTable);

  // Populate the table with test results
  table.columns.push({ width: 1 });
  table.rows.push(createTableRow("Type", "Total", "Percentage"));
  table.rows.push(createTableRow("✅ Passed", totalStatus.passed, `${((totalStatus.passed / totalTests) * 100).toFixed(1)}%`));
  if (totalStatus.flaky) {
    table.rows.push(createTableRow("⚠️ Flaky", totalStatus.flaky, `${((totalStatus.flaky / totalTests) * 100).toFixed(1)}%`, { style: "warning" }));
  }
  table.rows.push(createTableRow("❌ Failed", totalStatus.failed, `${((totalStatus.failed / totalTests) * 100).toFixed(1)}%`, { style: "attention" }));
  table.rows.push(createTableRow("⏭️ Skipped", totalStatus.skipped, `${((totalStatus.skipped / totalTests) * 100).toFixed(1)}%`, { style: "accent" }));
  table.rows.push(createTableRow("Total tests", totalTests, "100.0%", { isSubtle: true, weight: "Bolder" }));

  // Add the table to the card
  const container = {
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
    style: "emphasis", // Set the background color to black
  };

    // Group test details by status
    const groupedTestDetails: { [key: string]: { title: string; status: string; duration: number }[] } = {
      passed: [],
      failed: [],
      skipped: [],
      flaky: []
  };

  testResults.forEach(test => {
      if (test.status === 'passed') groupedTestDetails.passed.push(test);
      else if (test.status === 'failed') groupedTestDetails.failed.push(test);
      else if (test.status === 'skipped') groupedTestDetails.skipped.push(test);
      else if (test.status === 'flaky') groupedTestDetails.flaky.push(test);
  });

  // Add grouped test details to the container
  Object.keys(groupedTestDetails).forEach(status => {
    if (groupedTestDetails[status].length > 0) {
      container.items.push({
        type: "TextBlock",
        text: `${status.charAt(0).toUpperCase() + status.slice(1)} Tests`,
        weight: "Bolder",
        size: "Medium"
      });
      groupedTestDetails[status].forEach(test => {
        container.items.push({
          type: "Container",
          items: [
            {
              type: "TextBlock",
              text: `${test.title}`,
              weight: "Bolder",
              color: test.status === "passed" ? "Default" : (test.status === "failed" ? "Attention" : "Default")
            },
            {
              type: "TextBlock",
              text: `${test.status === "passed" ? "✅" : (test.status === "failed" ? "❌" : "⏭️")} ${test.status} - ${test.duration}ms`,
              spacing: "None",
              color: test.status === "passed" ? "Default" : (test.status === "failed" ? "Attention" : "Default")
            }
          ],
          style: test.status === "failed" ? "attention" : (test.status === "skipped" ? "default" : "default")
        } as any);
      });
    }
  });

  // Add the container to the body
  adaptiveCard.body.push(container);

  // Add the donut chart to the adaptive card
  adaptiveCard.body.push({
    type: "Image",
    url: donutChartUrl,
    size: "ExtraLarge", // Change size to ExtraLarge
    selectAction: {
      type: "Action.OpenUrl",
      url: donutChartUrl // Make the image clickable
    }
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

function readCtrfReport(filePath: string): any {
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

function extractTestResults(report: any): { title: string, status: string, duration: number }[] {
  // Access the correct path to the tests
  if (!report.results || !report.results.tests) {
      console.error("report.results.tests is undefined");
      return [];
  }
  return report.results.tests.map((test: any) => ({
      title: test.name,
      status: test.status,
      duration: test.duration
  }));
}