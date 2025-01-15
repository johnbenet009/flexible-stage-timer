# Flexible Stage Timer

[![GitHub Issues](https://img.shields.io/github/issues/johnbenet009/flexible-stage-timer)](https://github.com/johnbenet009/flexible-stage-timer/issues)
[![GitHub Stars](https://img.shields.io/github/stars/johnbenet009/flexible-stage-timer)](https://github.com/johnbenet009/flexible-stage-timer/stargazers)

This is a simple and free stage timer application built using Vite and Electron. It provides a straightforward way to manage time during performances, presentations, or any event that requires accurate timing.
![image](https://github.com/user-attachments/assets/8e7e4727-9479-4ddb-b9c7-97c09b3f4cb2)

## Features

-   Clean and intuitive user interface.
-   Clear display with extra time feature.
-   Separate window for a stage-facing timer view.
-   Customizable layout with the flexibility of Vite.
-   Dark theme.
![image](https://github.com/user-attachments/assets/8355f402-0e60-4a2d-b167-c5c2a0e205c4)
![image](https://github.com/user-attachments/assets/74b71c07-0755-4c09-a45c-a02d50f6f0ce)

## License

This project is licensed under the [Flexible Stage Timer License](LICENSE). You are free to:

-   Use this software for free.
-   Modify the code.
-   Distribute your modified versions.

However, you **MUST**:

-   Credit **Positive Developer** as the original developer.
-   If you make any modifications, you must contribute your changes back to a branch on this repository for the betterment of the main code. Pull Requests will be reviewed and, if suitable, merged.

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or higher recommended)
-   [npm](https://www.npmjs.com/) (comes with Node.js)
-   Basic understanding of JavaScript, HTML, and CSS
-    [Git](https://git-scm.com/)

### Installation

1.  **Clone the Repository:**

    ```bash
    git clone https://github.com/johnbenet009/flexible-stage-timer.git
    cd flexible-stage-timer
    ```

2.  **Install Dependencies:**

    ```bash
    npm install
    ```

    This command will install all required dependencies for both the Electron application and the development server.

3.  **Building the Vite Frontend**
   - The frontend source code is located in `vite-core`.
   - Navigate to the `vite-core` directory
    ```bash
    cd vite-core
    ```
   - Install the project dependencies.
    ```bash
    npm install
    ```
   - Build the Vite project with:
    ```bash
    npm run build
    ```
   - Copy the contents of `vite-core/dist` to the `public` directory of the root of the repository.

### Running the Application

1.  **Start the Application:**

    ```bash
    npm start
    ```

    This command will start both the development server and the Electron application.

   The Electron app will load your `index.html` in a main window, and it will open a secondary window on external screen.

### Developing the Frontend

The core logic and the user interface of the timer is built with [Vite](https://vitejs.dev/).

-   **Edit the Frontend**: The source code for the web application is in the `vite-core` directory. You can make changes to the application's UI and functionality by editing the files in this directory.
-   **Build the Frontend:** After you make any changes to the source code you have to build your changes with the command `npm run build` from the `vite-core` directory.
-   **Copy to Public Folder**: Copy all the files from the `vite-core/dist` folder into the `public` folder in the root of your repository.
-   **Test Your Changes**: Use `npm start` to view your changes in electron.
-   **Contribution**: If you plan to contribute your changes, create a new branch and create a pull request to this repository after your testing is completed.

### Building the Executable

To build a distributable version of your timer app, use the following command:

```bash
npm run build
```

The packaged application will be created inside the dist directory in the root of the repository. This will generate both installer .exe and portable .zip file for both 32 and 64 bit systems.

Contributing

Contributions are welcome! Please follow these steps:

Fork the repository.

Create a new branch for your feature or bug fix.

Make your changes to the code.

Build and copy your files to public folder.

Test thoroughly.

Commit your changes with clear, concise messages.

Push your branch to your fork.

Submit a pull request to the main repository.

Please ensure that you follow the license terms and credit the original developer.

Contact

For questions, suggestions, or issues, please open an issue on GitHub, or contact me directly through my GitHub Profile : johnbenet009

Credits

Developed by: Positive Developer.
