# uMetadataForms Editor

Prototype desktop editor for completing health data metadata documents.

This application is intended for testing purposes only to guide further
development. Make sure to read the licence before using this software.

Built with:

- [JSON Schema](http://json-schema.org/) |
[uMetadataForms Schemas](https://github.com/umetadataforms/schemas.git)
- [React](https://react.dev/) |
[React JSON Schema Form](https://github.com/rjsf-team/react-jsonschema-form)
- [Electron](https://electron.atom.io/) |
[TipTap](https://github.com/ueberdosis/tiptap)

<br>

## Table of Contents

- [Licence](#licence)
- [Installation](#installation)
- [Known Issues](#known-issues)
- [Acknowledgements](#acknowledgements)

<br>

## Licence

This software is licensed under the terms of the  MIT licence. Please read
it carefully before using this software: [LICENCE](./LICENSE).

<br>

## Installation

In the commands below, replace `<version>` with the version number from the latest test release.

### Debian/Ubuntu

Download `umetadataformseditor_<version>_amd64.deb` from the latest test [release].

To install, run:
``` bash
sudo apt install ./umetadataformseditor_<version>_amd64.deb
```
If the app doesn't launch, or has issues, try launching it from the command line
to see the error messages.

To uninstall, run:
``` bash
sudo apt remove umetadataformseditor
```
or
``` bash
sudo apt purge umetadataformseditor
```
After uninstalling, delete `~/.config/uMetadataFormsEditor` folder to
remove all application settings.

### Linux App Image

Download `uMetadataFormsEditor-<version>.AppImage` from latest test [release].

You need FUSE to run App Images:
```bash
sudo apt install libfuse2
```
Make the app image file executable:
```bash
chmod u+x uMetadataFormsEditor-<version>.AppImage
```
Run:
```bash
./uMetadataFormsEditor-<version>.AppImage
```
Depending on your system configuration, you may need to run the application
without a sandbox. Please be aware that running third-party software without
sandboxing can pose security risks.
```bash
./uMetadataFormsEditor-<version>.AppImage --no-sandbox
```
If the app doesn't launch, or has issues, try launching it from the command line
to see the error messages.

To uninstall, delete the app image file and delete
`~/.config/uMetadataFormsEditor` folder to remove all application settings.

<br>

### Windows 11

Download `uMetadataFormsEditor-Setup-<version>.exe` from the latest test [release]. 

To install, double click the `exe` file.

To uninstall, use the Windows uninstaller.

After uninstalling the app, delete the following folders:  
`C:\Users\<username>\AppData\Roaming\uMetadataFormsEditor`, and  
`C:\Users\<username>\AppData\Local\umetadataformseditor-updater`,  
where `<username>` is your Windows user name.

<br>

## Known Issues

- **Form validation messages**

  Validation errors appear both as a full list at the top of the form and at the
  bottom of relevant fields when you press the **Validate** button. The preview
  panel also shows field validation errors when displaying their preview;
  however, the preview panel does not display custom validation errors, such as
  checking whether the start date is before the end date in temporal coverage.

- **Typing / debouncing behaviour**

  Typing in text fields is debounced: changes are committed 1.8 seconds after
  the last keystroke. When typing slowly or pausing between words, this can make
  the interface feel a bit jerky.

- **Export**

  The file exporter defaults to the downloads folder rather than the current
  working directory.

<br>

## Acknowledgements

This work was funded by AISym4Med project number 101095387.

[release]: https://github.com/umetadataforms/editor/releases/tag/v0.0.1
