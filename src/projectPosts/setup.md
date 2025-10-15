---
title: "How to setup splunk and azure appinsights- a brief overview"
date: "2025-10-14"
summary: "Configuring splunk and azure appinsight "
---

## Observability Setup and Troubleshooting Guide

### FleetManagement API — Azure & Splunk Integration Demo

Overview

This document outlines how observability and telemetry were integrated into the FleetManagement API using Azure Application Insights and Splunk.
It also records the key setup steps, issues encountered, and resolutions applied during the process. This a quick guide that shows a high level overview of the steps involved in setting up splunk and azure app insights. To get a real feel for each platform's strengths and weaknesses, please refer to the appropriate documentation.

#### Azure Application Insights Setup

1. Create an Application Insights Resource

Go to the Azure Portal → Application Insights → Create Resource.

Choose:

Resource Group: FleetManagementDemo

Region: Same as your App Service or Function App

Name: fleetmanagement-appinsights

Once deployed, open the resource and copy the Instrumentation Key or Connection String.

2. Configure Application Insights in the .NET API

In Program.cs (or Startup.cs for older versions), add the telemetry service:

```
builder.Services.AddApplicationInsightsTelemetry(builder.Configuration["ApplicationInsights:ConnectionString"]);
```

In appsettings.json, add:

```
"ApplicationInsights": {
  "ConnectionString": "InstrumentationKey=YOUR-INSTRUMENTATION-KEY-HERE"
}
```

3. Verify Telemetry

Run the API locally and trigger requests (via Swagger or Postman).  
Then, in Azure:

Navigate to Application Insights → Live Metrics Stream

Confirm requests, dependencies, and custom metrics appear in real-time.

4. Custom Telemetry (Optional)

You can send custom events and metrics directly from the API:

```
_telemetry.TrackEvent("MaintenanceRecordCreated");
_telemetry.TrackMetric("MaintenanceCost", (double)record.Cost);

```

#### Common Errors & Fixes

Error: Argument 2: cannot convert from 'decimal' to 'double'

Cause: Application Insights TrackMetric expects a double, not a decimal.
Fix:

```
_telemetry.TrackMetric("MaintenanceCost", (double)record.Cost);


```

Error: Workload ID microsoft.net.workload.mono.toolchain is not recognized

Cause: The workload ID was not valid for the current SDK (Mono toolchain not required for Windows builds).
Fix: Removed the unnecessary line from the .csproj:

```
<!-- Removed -->
<!-- <Workload Include="microsoft.net.workload.mono.toolchain" /> -->


```

Issue: Project file missing from Solution Explorer

Cause: Visual Studio sometimes hides .csproj when using folder view.
Fix: Switch to Solution View or open .csproj directly in Explorer → Right-click → Include in Project.

Splunk Setup (Optional Integration)

Although this demo primarily uses Azure Application Insights, the setup for Splunk is similar.

1. Install Splunk and HTTP Event Collector (HEC)

Log into your Splunk Enterprise or Cloud instance.

Go to Settings → Data Inputs → HTTP Event Collector (HEC).

Create a new token:

Name: FleetManagementAPI

Index: main

Copy the Token Value and HEC Endpoint URL.

2. Configure Splunk Logging in .NET

Add the Splunk logging provider to your project (optional):

```
dotnet add package Serilog.Sinks.Splunk

```

Then update your logging configuration:

```
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.EventCollector("https://splunk-server:8088", "YOUR-SPLUNK-TOKEN")
    .CreateLogger();

```

3. Verify Logs in Splunk

Query in Splunk:

```
index=main source="FleetManagementAPI"


```

You should see log events from your API appear in real-time.

Testing and Validation

1. Run Unit Tests

Use xUnit test suite:

```
dotnet test
```

All tests should pass successfully.

2. Observability Verification

Trigger several API calls via Swagger.

Check Azure Application Insights → Logs → traces, requests, dependencies.

Confirm custom metric MaintenanceCost appears under Metrics.

| Component                      | Purpose                          | Status                   |
| :----------------------------- | :------------------------------- | :----------------------- |
| **Azure Application Insights** | Live telemetry, metrics, tracing | ✅ Configured            |
| **Splunk (optional)**          | External log ingestion           | ⚙️ Ready for integration |
| **xUnit + Moq**                | Unit testing framework           | ✅ Passing               |
| **EF Core InMemory**           | Lightweight DB for testing       | ✅ Working               |
| **Swagger**                    | Interactive API surface          | ✅ Working               |

#### Next Steps

- Deploy the API to Azure App Service.

- Configure continuous integration via GitHub Actions or Azure DevOps.

- Optionally forward telemetry from App Insights → Splunk via Azure Monitor Exporters.

#### Conclusion

The splunk was wired up and dashboards were made before the azure appInsights was configured. It appears that azure appInsights has some of the same capabilities as splunk. Without digging too deep into the documentation for both Azure appinsight and splunk, it looks like we can send the same data from the app to Azure, where we can make dashboards, alerts, etc. Splunk may make it easier to do this. We can create SQLish commands and make the results into a dashboard component very easily. Using one or the other may depend upon the complexity of the app, where the data is coming from(splunk can get data from a variety of sources), and how much familiarity the developer has with each platform.
