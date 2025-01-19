# Flexible Stage Timer App

![Flexible Stage Timer App]

A professional stage timing application built with vite, TypeScript, and Electron, designed for live events, presentations, and performances. This application bundles a Node.js server to ensure that it will run on different operating systems, even without having Node.js installed on the system.

## Features

- **Dual Timer Display**
  - Setup timer for preparation
  - Live timer with fullscreen display
  - Extra time management
  - Visual alerts and notifications

- **Program Management**
  - Organize programs by categories
  - Quick program selection and timing
  - Edit and delete functionality
  - Program notifications

- **Alert System**
  - Custom alert messages
  - Flash alerts
  - Scrolling text display
  - Attention mode

- **Display Customization**
  - Adjustable timer sizes
  - Custom backgrounds (Image/Video/Webcam)
  - Alert scroll speed control
  - Clock display option

- **Multi-Screen Support**
  - Opens a secondary timer window on an available secondary screen, without showing the icon in the taskbar
  - Detects when there's a secondary screen and displays an alert if none are available.

- **Persistent Data**
  - Store programs, categories, and settings using local storage
- **Responsive Design**
  - Clean, modern interface
  - Touch-friendly controls
  - Fullscreen display mode
  - Professional animations

- **Bundled Nodejs**
   - Includes a bundled version of Nodejs to ensure it works on systems without NodeJS installed.

## Tech Stack

- React 18
- TypeScript
- Tailwind CSS
- Vite
- Lucide Icons
- React Router
- Electron

## Project Structure

The project is structured into two main parts:

- **`vite-core`:** Contains the vite frontend application built with Vite.

- **Root directory:** Contains the Electron application which is responsible for packaging and launching the `vite-core` application, including a local Node.js server.

## Installation and Setup

### Prerequisites

-   [Node.js](https://nodejs.org/) (required for development and building)
-   [npm](https://www.npmjs.com/) (comes with Node.js)
-   [Git](https://git-scm.com/) (Optional, if you want to contribute to the project)

### Steps

1.  Clone the repository:

    ```bash
    git clone https://github.com/johnbenet009/flexible-stage-timer.git
    ```
2.  Navigate to the project directory:

    ```bash
    cd flexible-stage-timer
    ```
3.  Install the Electron app's dependencies:

    ```bash
    npm install
    ```
4. **Install dependencies for vite project**:

    ```bash
    cd vite-core
    npm install
    ```

### Running the Application

1. To start the application in development mode, launch the server and electron app from the root folder:
    ```bash
    npm start
    ```

### Building the Application

1. To build the Vite application, navigate to the `vite-core` directory and run:
    ```bash
        cd vite-core
        npm run build
    ```
2.  Copy the contents of the `vite-core/dist` folder to `public` folder of the Electron project.
3. Build the electron app and generate a standalone installer in the root folder:
    ```bash
      npm run build
    ```

4. The installer and unpacked application files will be located in the `dist` directory.

## Usage

### Main Timer Controls

-   Use the setup timer to prepare your timing.
-   Start/Stop/Pause the live timer.
-   Add or subtract time with quick controls.
-   Toggle attention mode for important moments.

### Program Management

-   Create categories for different event segments.
-   Add programs with specific durations.
-   Quick-start programs from the list.
-   Send "Up Next" notifications.

### Alert System

-   Display custom alert messages.
-   Use flash alerts for immediate attention.
-   Control alert display size and scroll speed.
-   Clear alerts with a single click.

### Display Settings

-   Customize timer and alert sizes.
-   Upload background images or videos.
-   Use webcam as background.
-   Toggle clock display.

### Multi-Screen Support

-   If a secondary screen is detected, it will open on that screen by default.
-   If a secondary screen is not detected, it will show on your main screen with a prompt.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**John Benet**

-   GitHub: [@johnbenet009](https://github.com/johnbenet009)

## Acknowledgments

-   Built with vite.
-   Styled with Tailwind CSS.
-   Icons by Lucide React.
-   Packaged using Electron.