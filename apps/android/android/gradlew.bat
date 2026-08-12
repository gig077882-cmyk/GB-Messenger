@echo off
rem Gradle wrapper bootstrap script. The wrapper JAR is supplied by Gradle during dependency setup.
gradle -p "%~dp0" %*
