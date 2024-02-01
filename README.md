# @kdrowe/gclient

## Introduction

`@kdrowe/gclient` is a NodeJS library designed to provide a simplified and streamlined way to interact with various Google APIs, including Gmail, Sheets, and more. This library is built to make it easy for developers to integrate Google services into their NodeJS applications with minimal setup and configuration.

## Installation

To install `@kdrowe/gclient`, run the following command in your NodeJS project:

```bash
npm install @kdrowe/gclient
```

## Usage

1. Configure GOOGLE_SHEETS_CREDENTIALS env var in your application
* Value should be the path to a JSON file containing credentials of a service account that has access to the Google Sheets API and access to the spreadsheet you want to interact with.
* If GOOGLE_SHEETS_CREDENTIALS is not found, then the standard GOOGLE_APPLICATION_CREDENTIALS used by Google Client Libraries will be checked.
* If neither of these env vars are defined, the Sheet object will fail.
* Note that ADC is not supported.


## Publishing a New Revision to npm
To publish a new revision of @kdrowe/gclient to npm for use by client applications, follow these steps:

1. Increment the Version Number in package.json:

* Open the package.json file.
* Increment the version number following semantic versioning.
* Save the changes.
2. Publish to npm:

* Run the following command to publish the new version to npm:
```bash
npm publish
```
* Ensure you are logged in to npm with the account that has permissions to update the package.
3. Update Client Applications:
* Go to the client application's repository.
* Open the package.json file in the client application.
* Update the dependency version number for @kdrowe/gclient to the new version.
* Save the changes.
* Run the following command to install the latest revision:
```bash
npm install
```
