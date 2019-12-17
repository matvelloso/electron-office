<img src="build/icons/128x128.png" alt="logo" height="80" align="right" />

# Electron Office consumer edition

This is a **unofficial**, **unsupported** (really, I just hacked this in a weekend, keep your expectations very low, folks) cross platform Electron wrapper for Office 365 and Office consumer web interfaces, so you have have a consistent, fast, closer to a native-like experience across platforms, including Linux.

Most of this project is a shameless copy of the nice work that Howard (https://github.com/eNkru/freelook) started by creating an Electron wrapper for Outlook consumer and then Tom (https://github.com/tomlm/electron-outlook) extended by adding support for Outlook 365 (so you can use with your Azure AD accounts). I'm expanding it further for all of Office, so you can use Word, Excel OneNote, PowerPoint, OneDrive, Skype, etc.

**Do expect (many) bugs and security issues.**

(Note: If you came here looking for Microsoft Teams for Linux, please use the official client: https://aka.ms/get-teams-linux)

## Latest features and notes

* The icon of the app changes according to the application you are currently using (most of the time)
* You can navigate from Word to Excel, to OneDrive, to Outlook, etc. all in the same window (use the Office menu at the top left corner)
* Disabled nodeIntegration - I believe OneDrive's JavaScript plumbing requires this to be off

## How to use or contribute to this

There are two key folders here:

* Consumer: Use this if you use Office with a Microsoft Account (e.g. Hotmail, Outlook.com, etc)
* Office365: Use this if you use Office with an Active Directory account (an Office 365 subscription) 

The URLs are often different, plus the credentials you will be using as well, so it makes sense to separate these, especially if you intend to save your credentials.

In each folder you will find two different Electron applications:

* Outlook: This is mostly a copy from Tom's code, it's the original Electron app focused on enabling Outlook
* Office: While this should also work with Outlook (it contains most of the code from the Outlook folder), it defaults to opening OneDrive where you have a menu to get you to any of Office, plus a bunch of additional code that should enable using the different Office applications on the web

## Download and Install

If you just want to download the installers, go [here](https://github.com/matvelloso/electron-office/releases). 

May the Force be with you...

## Build & Install
Clone the repository and run in development mode.
```
git clone https://github.com/matvelloso/electron-office.git
cd electron-office
yarn
yarn start
```
(Highly recommend using Visual Studio Code for both editing this code and debugging)

Build the application 
```
yarn run dist:linux
```
This will build an AppImage in the dist folder. This file can be run in most popular linux distributions.

## Release
```
npm version (new release version)
git push origin master
git push origin --tags
npm publish
```
## Hate it? Want to contribute?

There are many things I could use help with here. Such as:

* General bug fixing (I've never built anything in Electron before so... ¯\_(ツ)_/¯)
* Fixing Icons (I just used screen shots for now so they aren't great)
* For Office 365 clients, fix the auth issues for other ADFS clients and non ADFS scenarios (auth will probably fail today if you fall in that bucket)
* Better keyboard shortcuts
* Better navigation/menus
* Better testing across platforms
* More control for when to launch things directly on the browser?
* Better code reuse (so far the consumer and the Office 365 editions are almost the same code with small differences, shouldn't need to duplicate the whole thing)
* Would be nice if it recognized file extensions, automatically opened them and uploaded them to your OneDrive, then into the online editor?
* Other ideas?

## License
Original license:
[MIT](https://github.com/eNkru/electron-xiami/blob/master/LICENSE) by [Howard J](https://enkru.github.io/)
