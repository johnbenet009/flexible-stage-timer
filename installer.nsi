; Stage Timer App NSIS Installer Script
; This script creates a single executable installer for the Stage Timer App

!define APPNAME "Stage Timer App"
!define COMPANYNAME "Positive Developer"
!define DESCRIPTION "A flexible stage timer application for presentations and events"
!define VERSIONMAJOR 2
!define VERSIONMINOR 0
!define VERSIONBUILD 0
!define HELPURL "https://github.com/johnbenet009/flexible-stage-timer"
!define UPDATEURL "https://github.com/johnbenet009/flexible-stage-timer"
!define ABOUTURL "https://github.com/johnbenet009/flexible-stage-timer"
!define INSTALLSIZE 180000 ; Size in KB (approximately 180MB)

; Include Modern UI
!include "MUI2.nsh"
!include "LogicLib.nsh"

; General
Name "${APPNAME}"
OutFile "Stage-Timer-App-Setup.exe"
Unicode True
InstallDir "$LOCALAPPDATA\${APPNAME}"
InstallDirRegKey HKCU "Software\${COMPANYNAME}\${APPNAME}" "InstallLocation"
RequestExecutionLevel user

; Compression
SetCompressor /SOLID lzma
SetCompressorDictSize 32

; Interface Settings
!define MUI_ABORTWARNING
!define MUI_ICON "public\icon.ico"
!define MUI_UNICON "public\icon.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "public\icon.ico"
!define MUI_WELCOMEFINISHPAGE_BITMAP "public\icon.ico"

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_RUN "$INSTDIR\stage-timer-app.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch Stage Timer App"
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; Languages
!insertmacro MUI_LANGUAGE "English"

; Version Information
VIProductVersion "${VERSIONMAJOR}.${VERSIONMINOR}.${VERSIONBUILD}.0"
VIAddVersionKey "ProductName" "${APPNAME}"
VIAddVersionKey "CompanyName" "${COMPANYNAME}"
VIAddVersionKey "LegalCopyright" "Copyright © 2024 ${COMPANYNAME}"
VIAddVersionKey "FileDescription" "${DESCRIPTION}"
VIAddVersionKey "FileVersion" "${VERSIONMAJOR}.${VERSIONMINOR}.${VERSIONBUILD}.0"
VIAddVersionKey "ProductVersion" "${VERSIONMAJOR}.${VERSIONMINOR}.${VERSIONBUILD}.0"
VIAddVersionKey "InternalName" "stage-timer-app"
VIAddVersionKey "OriginalFilename" "Stage-Timer-App-Setup.exe"

; Installer Sections
Section "Install" SecInstall
    SetOutPath "$INSTDIR"
    
    ; Copy all files from the packaged app
    File /r "dist\stage-timer-app-win32-x64\*.*"
    
    ; Create desktop shortcut
    CreateShortcut "$DESKTOP\Stage Timer.lnk" "$INSTDIR\stage-timer-app.exe" "" "$INSTDIR\stage-timer-app.exe" 0
    
    ; Create start menu shortcuts
    CreateDirectory "$SMPROGRAMS\${APPNAME}"
    CreateShortcut "$SMPROGRAMS\${APPNAME}\Stage Timer.lnk" "$INSTDIR\stage-timer-app.exe" "" "$INSTDIR\stage-timer-app.exe" 0
    CreateShortcut "$SMPROGRAMS\${APPNAME}\Uninstall.lnk" "$INSTDIR\Uninstall.exe" "" "$INSTDIR\Uninstall.exe" 0
    
    ; Write registry keys
    WriteRegStr HKCU "Software\${COMPANYNAME}\${APPNAME}" "InstallLocation" "$INSTDIR"
    WriteRegStr HKCU "Software\${COMPANYNAME}\${APPNAME}" "Version" "${VERSIONMAJOR}.${VERSIONMINOR}.${VERSIONBUILD}"
    
    ; Write uninstaller
    WriteUninstaller "$INSTDIR\Uninstall.exe"
    
    ; Add/Remove Programs entry
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "DisplayName" "${APPNAME}"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "UninstallString" "$INSTDIR\Uninstall.exe"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "QuietUninstallString" "$INSTDIR\Uninstall.exe /S"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "InstallLocation" "$INSTDIR"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "DisplayIcon" "$INSTDIR\stage-timer-app.exe"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "Publisher" "${COMPANYNAME}"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "HelpLink" "${HELPURL}"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "URLUpdateInfo" "${UPDATEURL}"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "URLInfoAbout" "${ABOUTURL}"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "DisplayVersion" "${VERSIONMAJOR}.${VERSIONMINOR}.${VERSIONBUILD}"
    WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "VersionMajor" ${VERSIONMAJOR}
    WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "VersionMinor" ${VERSIONMINOR}
    WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "NoModify" 1
    WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "NoRepair" 1
    WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "EstimatedSize" ${INSTALLSIZE}
SectionEnd

; Uninstaller Section
Section "Uninstall"
    ; Remove files
    RMDir /r "$INSTDIR"
    
    ; Remove shortcuts
    Delete "$DESKTOP\Stage Timer.lnk"
    RMDir /r "$SMPROGRAMS\${APPNAME}"
    
    ; Remove registry keys
    DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}"
    DeleteRegKey HKCU "Software\${COMPANYNAME}\${APPNAME}"
    DeleteRegKey /ifempty HKCU "Software\${COMPANYNAME}"
SectionEnd

; Functions
Function .onInit
    ; Check if already installed
    ReadRegStr $R0 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "UninstallString"
    StrCmp $R0 "" done
    
    MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION "${APPNAME} is already installed. $\n$\nClick OK to remove the previous version or Cancel to cancel this upgrade." IDOK uninst
    Abort
    
    uninst:
        ClearErrors
        ExecWait '$R0 /S _?=$INSTDIR'
        
        IfErrors no_remove_uninstaller done
        no_remove_uninstaller:
    
    done:
FunctionEnd