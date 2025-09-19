/**
 * Windows installer creation script for Local Task Tracker
 * Creates an MSI installer with auto-start configuration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  appName: 'Local Task Tracker',
  appVersion: '1.0.0',
  appDescription: 'Windows-optimized desktop productivity application for time tracking and task management',
  appPublisher: 'Local Task Tracker',
  appUrl: 'https://github.com/local-task-tracker',
  executableName: 'local-task-tracker.exe',
  installDir: 'Local Task Tracker',
  startMenuFolder: 'Local Task Tracker',
  desktopShortcut: true,
  autoStart: true
};

/**
 * Create WiX installer configuration
 */
function createWixConfig() {
  const wixConfig = `<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
  <Product Id="*" 
           Name="${config.appName}" 
           Language="1033" 
           Version="${config.appVersion}" 
           Manufacturer="${config.appPublisher}" 
           UpgradeCode="12345678-1234-1234-1234-123456789012">
    
    <Package InstallerVersion="200" 
             Compressed="yes" 
             InstallScope="perMachine" 
             Description="${config.appDescription}" />

    <MajorUpgrade DowngradeErrorMessage="A newer version of [ProductName] is already installed." />
    <MediaTemplate EmbedCab="yes" />

    <Feature Id="ProductFeature" Title="${config.appName}" Level="1">
      <ComponentGroupRef Id="ProductComponents" />
      <ComponentRef Id="ApplicationShortcut" />
      <ComponentRef Id="DesktopShortcut" />
      <ComponentRef Id="AutoStartRegistry" />
    </Feature>

    <!-- Installation directory -->
    <Directory Id="TARGETDIR" Name="SourceDir">
      <Directory Id="ProgramFilesFolder">
        <Directory Id="INSTALLFOLDER" Name="${config.installDir}" />
      </Directory>
      
      <!-- Start Menu -->
      <Directory Id="ProgramMenuFolder">
        <Directory Id="ApplicationProgramsFolder" Name="${config.startMenuFolder}" />
      </Directory>
      
      <!-- Desktop -->
      <Directory Id="DesktopFolder" Name="Desktop" />
      
      <!-- Startup folder for auto-start -->
      <Directory Id="StartupFolder" Name="Startup" />
    </Directory>

    <!-- Application files -->
    <ComponentGroup Id="ProductComponents" Directory="INSTALLFOLDER">
      <Component Id="MainExecutable" Guid="*">
        <File Id="MainExe" 
              Source="dist/${config.executableName}" 
              KeyPath="yes" 
              Checksum="yes" />
        
        <!-- Windows service registration -->
        <ServiceInstall Id="TaskTrackerService"
                       Type="ownProcess"
                       Vital="yes"
                       Name="LocalTaskTracker"
                       DisplayName="${config.appName} Service"
                       Description="${config.appDescription}"
                       Start="auto"
                       Account="LocalSystem"
                       ErrorControl="ignore"
                       Interactive="no">
          <util:ServiceConfig FirstFailureActionType="restart"
                             SecondFailureActionType="restart"
                             ThirdFailureActionType="restart"
                             RestartServiceDelayInSeconds="60"
                             ResetPeriodInDays="1" />
        </ServiceInstall>
        
        <ServiceControl Id="StartService"
                       Start="install"
                       Stop="both"
                       Remove="uninstall"
                       Name="LocalTaskTracker"
                       Wait="yes" />
      </Component>
      
      <!-- Database files -->
      <Component Id="DatabaseFiles" Guid="*">
        <File Id="DatabaseSchema" Source="database/schema.sql" KeyPath="yes" />
        <CreateFolder />
      </Component>
      
      <!-- Configuration files -->
      <Component Id="ConfigFiles" Guid="*">
        <File Id="PackageJson" Source="package.json" KeyPath="yes" />
        <CreateFolder />
      </Component>
    </ComponentGroup>

    <!-- Start Menu shortcut -->
    <Component Id="ApplicationShortcut" Directory="ApplicationProgramsFolder" Guid="*">
      <Shortcut Id="ApplicationStartMenuShortcut"
                Name="${config.appName}"
                Description="${config.appDescription}"
                Target="[#MainExe]"
                WorkingDirectory="INSTALLFOLDER" />
      <RemoveFolder Id="ApplicationProgramsFolder" On="uninstall" />
      <RegistryValue Root="HKCU" 
                     Key="Software\\${config.appPublisher}\\${config.appName}" 
                     Name="installed" 
                     Type="integer" 
                     Value="1" 
                     KeyPath="yes" />
    </Component>

    <!-- Desktop shortcut -->
    <Component Id="DesktopShortcut" Directory="DesktopFolder" Guid="*">
      <Shortcut Id="ApplicationDesktopShortcut"
                Name="${config.appName}"
                Description="${config.appDescription}"
                Target="[#MainExe]"
                WorkingDirectory="INSTALLFOLDER" />
      <RegistryValue Root="HKCU" 
                     Key="Software\\${config.appPublisher}\\${config.appName}" 
                     Name="desktop" 
                     Type="integer" 
                     Value="1" 
                     KeyPath="yes" />
    </Component>

    <!-- Auto-start registry entry -->
    <Component Id="AutoStartRegistry" Directory="INSTALLFOLDER" Guid="*">
      <RegistryValue Root="HKCU"
                     Key="Software\\Microsoft\\Windows\\CurrentVersion\\Run"
                     Name="${config.appName}"
                     Type="string"
                     Value="[#MainExe]"
                     KeyPath="yes" />
    </Component>

    <!-- UI customization -->
    <UI>
      <UIRef Id="WixUI_InstallDir" />
      <Publish Dialog="WelcomeDlg"
               Control="Next"
               Event="NewDialog"
               Value="InstallDirDlg"
               Order="2">1</Publish>
      <Publish Dialog="InstallDirDlg"
               Control="Back"
               Event="NewDialog"
               Value="WelcomeDlg"
               Order="2">1</Publish>
    </UI>

    <!-- License agreement -->
    <WixVariable Id="WixUILicenseRtf" Value="license.rtf" />
    
    <!-- Installer icon -->
    <Icon Id="icon.ico" SourceFile="assets/icon.ico" />
    <Property Id="ARPPRODUCTICON" Value="icon.ico" />
    
    <!-- Add/Remove Programs information -->
    <Property Id="ARPHELPLINK" Value="${config.appUrl}" />
    <Property Id="ARPURLINFOABOUT" Value="${config.appUrl}" />
    <Property Id="ARPNOREPAIR" Value="1" />
    <Property Id="ARPNOMODIFY" Value="1" />
  </Product>
</Wix>`;

  fs.writeFileSync('installer.wxs', wixConfig);
  console.log('✅ WiX configuration created: installer.wxs');
}

/**
 * Create a simple license file
 */
function createLicenseFile() {
  const license = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
\\f0\\fs24
Local Task Tracker License Agreement

This software is provided "as is" without warranty of any kind.

By installing this software, you agree to use it responsibly and in accordance with applicable laws.

The software is designed to help improve productivity through time tracking and task management.

All data is stored locally on your computer for privacy and security.

For support and updates, visit: ${config.appUrl}
}`;

  fs.writeFileSync('license.rtf', license);
  console.log('✅ License file created: license.rtf');
}

/**
 * Create installer build script
 */
function createBuildScript() {
  const buildScript = `@echo off
echo Building Local Task Tracker Installer...
echo.

REM Check if WiX is installed
where candle >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: WiX Toolset not found in PATH
    echo Please install WiX Toolset from: https://wixtoolset.org/
    echo.
    pause
    exit /b 1
)

REM Build the application first
echo Building application...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Application build failed
    pause
    exit /b 1
)

REM Package the executable
echo Creating executable...
call npm run package
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Executable packaging failed
    pause
    exit /b 1
)

REM Compile WiX source
echo Compiling installer...
candle installer.wxs -ext WixUtilExtension
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: WiX compilation failed
    pause
    exit /b 1
)

REM Link and create MSI
echo Creating MSI installer...
light installer.wixobj -ext WixUIExtension -ext WixUtilExtension -out "Local Task Tracker Setup.msi"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: MSI creation failed
    pause
    exit /b 1
)

REM Cleanup
del installer.wixobj

echo.
echo ✅ Installer created successfully: "Local Task Tracker Setup.msi"
echo.
echo The installer includes:
echo   - Application executable with Windows service
echo   - Desktop and Start Menu shortcuts
echo   - Auto-start configuration
echo   - Automatic service installation
echo.
pause`;

  fs.writeFileSync('build-installer.bat', buildScript);
  console.log('✅ Build script created: build-installer.bat');
}

/**
 * Create installation instructions
 */
function createInstructions() {
  const instructions = `# Local Task Tracker - Windows Installer

## Prerequisites

1. **WiX Toolset**: Download and install from https://wixtoolset.org/
   - Required for creating MSI installers
   - Add WiX to your system PATH

2. **Node.js**: Ensure Node.js is installed and npm is available

## Building the Installer

1. **Build the application**:
   \`\`\`bash
   npm run build
   npm run package
   \`\`\`

2. **Create the installer**:
   \`\`\`bash
   # On Windows
   build-installer.bat
   
   # Or manually
   candle installer.wxs -ext WixUtilExtension
   light installer.wixobj -ext WixUIExtension -ext WixUtilExtension -out "Local Task Tracker Setup.msi"
   \`\`\`

## Installer Features

The created MSI installer includes:

- **Application Installation**: Installs the executable to Program Files
- **Windows Service**: Automatically installs and starts as a Windows service
- **Auto-start**: Configures the application to start with Windows
- **Shortcuts**: Creates desktop and Start Menu shortcuts
- **Uninstaller**: Provides clean uninstallation through Add/Remove Programs

## Installation Process

1. Run "Local Task Tracker Setup.msi"
2. Follow the installation wizard
3. The application will automatically:
   - Install to Program Files
   - Create shortcuts
   - Install as a Windows service
   - Start automatically with Windows
   - Begin running on http://localhost:3001

## Service Management

After installation, you can manage the service using:

\`\`\`cmd
# Start service
net start "LocalTaskTracker"

# Stop service
net stop "LocalTaskTracker"

# Check service status
sc query "LocalTaskTracker"
\`\`\`

## Uninstallation

Use Windows "Add or Remove Programs" to uninstall. This will:
- Stop and remove the Windows service
- Remove all application files
- Clean up shortcuts and registry entries
- Preserve user data (database files)

## Troubleshooting

- **Port conflicts**: The application will automatically find an available port
- **Service issues**: Check Windows Event Viewer for service-related errors
- **Permissions**: The service runs as LocalSystem for full Windows integration
`;

  fs.writeFileSync('INSTALLER.md', instructions);
  console.log('✅ Installation instructions created: INSTALLER.md');
}

/**
 * Main installer creation function
 */
function createInstaller() {
  console.log('🚀 Creating Windows installer for Local Task Tracker...\n');

  try {
    // Create necessary files
    createWixConfig();
    createLicenseFile();
    createBuildScript();
    createInstructions();

    console.log('\n✅ Windows installer configuration created successfully!');
    console.log('\nNext steps:');
    console.log('1. Install WiX Toolset from https://wixtoolset.org/');
    console.log('2. Run "build-installer.bat" to create the MSI installer');
    console.log('3. Distribute "Local Task Tracker Setup.msi" to users');
    console.log('\nThe installer will provide:');
    console.log('  ✓ Windows service installation');
    console.log('  ✓ Auto-start with Windows');
    console.log('  ✓ Desktop and Start Menu shortcuts');
    console.log('  ✓ Automatic port detection');
    console.log('  ✓ Clean uninstallation');

  } catch (error) {
    console.error('❌ Error creating installer configuration:', error);
    process.exit(1);
  }
}

// Run the installer creation
if (require.main === module) {
  createInstaller();
}

module.exports = { createInstaller, config };