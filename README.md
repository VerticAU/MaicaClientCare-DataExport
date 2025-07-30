[![Deploy to Salesforce](https://raw.githubusercontent.com/afawcett/githubsfdeploy/master/deploy.png)](https://githubsfdeploy.herokuapp.com)

> **Important:**  
> The [`MaicaClientCare-Common`](https://github.com/VerticAU/MaicaClientCare-Common) package must be deployed **prior to** installing or deploying any other MaicaClientCare-related packages

## Data Export Custom User Interface and Export Tool
The **Data Export Custom User Interface and Export Tool** provides a simple and intuitive interface for selecting and initiating data exports.

Exports are defined using a custom metadata type called **Data Export**. Each record in this metadata table represents a specific export configuration. When a user selects a data export, the associated custom logic is executed behind the scenes. This logic generates the corresponding data file and exports it in the predefined format.

Once generated, the export file can be downloaded directly from within the user interface in its prescribed format.
