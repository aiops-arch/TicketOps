@echo off
setlocal
cd /d "%~dp0"

set "JAVA21=C:\Program Files\Microsoft\jdk-21.0.10.7-hotspot"
set "SDK=%LOCALAPPDATA%\Android\Sdk"

if exist "%JAVA21%\bin\java.exe" (
  set "JAVA_HOME=%JAVA21%"
)

if "%JAVA_HOME%"=="" (
  echo JAVA_HOME is not set and JDK 21 was not found.
  echo Install OpenJDK 21 before building the APK.
  exit /b 1
)

if not exist "%SDK%\platforms\android-35\android.jar" (
  echo Android SDK platform android-35 was not found.
  echo Install Android SDK command line tools and android-35 platform.
  exit /b 1
)

set "ANDROID_HOME=%SDK%"
set "ANDROID_SDK_ROOT=%SDK%"
set "PATH=%JAVA_HOME%\bin;%SDK%\cmdline-tools\latest\bin;%SDK%\platform-tools;%PATH%"

echo Building web assets...
call npm.cmd run build:web
if errorlevel 1 exit /b 1

echo Syncing Android project...
call npx.cmd cap sync android
if errorlevel 1 exit /b 1

echo Building debug APK...
cd android
call gradlew.bat assembleDebug
if errorlevel 1 exit /b 1

cd ..
copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "TicketOps-debug.apk"
echo.
echo APK created:
echo %CD%\TicketOps-debug.apk
