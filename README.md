# Prettier Playwright MS Teams Report

!npm version
!Downloads
!License

**Prettier Playwright MS Teams Report** is an enhanced version of the original playwright-msteams-reporter. This package improves the reporting capabilities of Playwright by sending detailed and visually appealing test results to Microsoft Teams.

## Features

- **Enhanced Reporting**: Generates detailed test reports with additional metrics and visualizations.
- **Donut Chart Visualization**: Includes a donut chart to visualize the distribution of passed, failed, skipped, and flaky tests.
- **Percentage Metrics**: Displays the percentage of each test status alongside the total counts.
- **Customizable Notifications**: Allows customization of notification messages and styles.
- **Grouped Test Details**: Groups test results by status and provides detailed information for each test.

## Prerequisites

To use this reporter, you must have a Microsoft Teams webhook URL. You can create a webhook URL using the Microsoft Teams Power Automate connector or the Microsoft Teams incoming webhook functionality.

## Installation

To install the package, run:

```bash
npm install prettier-playwright-msteams-report
```

## Usage

To use the reporter in your Playwright tests, configure it in your Playwright configuration file (`playwright.config.ts` or `playwright.config.js`):

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['line'],
    ['prettier-playwright-msteams-report', {
      webhookUrl: 'YOUR_TEAMS_WEBHOOK_URL',
      title: 'Playwright Test Results',
      notifyOnSuccess: true,
      enableEmoji: true,
      linkToResultsUrl: 'YOUR_CI_RESULTS_URL',
      linkToResultsText: 'View CI Results',
      linkTextOnFailure: 'View Failure Details',
      linkUrlOnFailure: 'YOUR_FAILURE_DETAILS_URL',
      mentionOnFailure: ['user@example.com'],
      mentionOnFailureText: 'Attention: Test Failures Detected!',
      debug: false,
      quiet: false,
    }]
  ],
});
```

## Configuration Options

- **webhookUrl**: The Microsoft Teams webhook URL to send the notifications.
- **title**: The title of the notification.
- **notifyOnSuccess**: Whether to send notifications for successful test runs.
- **enableEmoji**: Whether to include emojis in the notification.
- **linkToResultsUrl**: URL to the CI results.
- **linkToResultsText**: Text for the link to CI results.
- **linkTextOnFailure**: Text for the link to failure details.
- **linkUrlOnFailure**: URL to the failure details.
- **mentionOnFailure**: List of email addresses to mention on test failures.
- **mentionOnFailureText**: Custom text for mentioning users on test failures.
- **debug**: Enable debug mode to log the notification payload without sending it.
- **quiet**: Suppress console logs.

## Changes from the Original

- **Donut Chart Generation**: Added a function to generate a donut chart using `QuickChart` to visualize test results.
- **Percentage Metrics**: Updated the table to include percentage metrics for each test status.
- **Background Color**: Set the background color of the notification container to black for better contrast.
- **Grouped Test Details**: Added detailed grouping of test results by status (passed, failed, skipped, flaky) and included these details in the adaptive card.
- **Dynamic Report Path**: Dynamically determine the report path for better flexibility.
- **Improved Logging**: Enhanced logging for better debugging and transparency.

## Example Cards

Here you can see an example card for failed test results:

![image](https://github.com/user-attachments/assets/447d685b-05b1-408c-9ed3-5587969c19d8)



## Credits

This project is based on the original playwright-msteams-reporter by Elio Struyf. You can reach him at mail@elio.dev.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request with your changes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Support
If you find this project useful, consider supporting me:

<a href="https://www.buymeacoffee.com/brentsingh" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>

