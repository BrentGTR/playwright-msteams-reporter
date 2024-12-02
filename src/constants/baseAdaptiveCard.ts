import { AdaptiveCard } from "../models";

export const BaseAdaptiveCard = <AdaptiveCard>
{
  "type": "AdaptiveCard",
  "body": [    
    {
      "type": "ColumnSet",
      "columns": [
        {
          "type": "Column",
          "width": "stretch",
          "items": [
            {
              "type": "TextBlock",
              "text": "Type",
              "weight": "Bolder"
            },
            {
              "type": "TextBlock",
              "text": "Passed",
              "spacing": "Small"
            },
            {
              "type": "TextBlock",
              "text": "Failed",
              "spacing": "Small"
            },
            {
              "type": "TextBlock",
              "text": "Skipped",
              "spacing": "Small"
            },
            {
              "type": "TextBlock",
              "text": "Total Tests",
              "spacing": "Small"
            }
          ]
        },
        {
          "type": "Column",
          "width": "auto",
          "items": [
            {
              "type": "TextBlock",
              "text": "Total",
              "weight": "Bolder"
            },
            {
              "type": "TextBlock",
              "text": "${passed}",
              "spacing": "Small"
            },
            {
              "type": "TextBlock",
              "text": "${failed}",
              "spacing": "Small"
            },
            {
              "type": "TextBlock",
              "text": "${skipped}",
              "spacing": "Small"
            },
            {
              "type": "TextBlock",
              "text": "${total}",
              "spacing": "Small"
            }
          ]
        }
      ]
    },
    {
      "type": "TextBlock",
      "text": "Test Name: ${testName}",
      "wrap": true
    }
  ],
  "msteams": {
    "width": "Full"
  },
  "actions": [],
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "version": "1.6"
};