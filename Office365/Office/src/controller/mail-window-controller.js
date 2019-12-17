const { app, BrowserWindow, shell, ipcMain, Menu, webFrame } = require('electron')
const settings = require('electron-settings')
const CssInjector = require('../js/css-injector')
const path = require('path')

const outlookUrl = 'https://outlook.office365.com'
const officeUrl = 'https://www.office.com/?auth=2' //1 for MSA, 2 for AAD
const deeplinkUrls = ['outlook-sdf.office.com/mail/deeplink', 'outlook.office365.com/mail/deeplink', 'outlook.office.com/mail/deeplink']
const outlookUrls = ['outlook.office365.com', 'outlook.office.com',  'outlook-sdf.office.com']

class MailWindowController {
    constructor() {
        this.init()
    }

    init() {
        // Get configurations.
        const showWindowFrame = settings.get('showWindowFrame', true)
        this.mail = this.createWindow(outlookUrl + '/mail');
        this.calendar = this.createWindow(outlookUrl + '/calendar');
        this.people = this.createWindow(outlookUrl + '/people');
        this.files = this.createWindow(outlookUrl + '/files');
        this.onedrive = this.createWindow(officeUrl);

        // Show window handler
        ipcMain.on('show', (event) => {
            this.show()
        })

        // Create the Application's main menu
        var template = [{
            label: "Application",
            submenu: [
                { label: "About Application", selector: "orderFrontStandardAboutPanel:" },
                { type: "separator" },
                { label: "Quit", accelerator: "Command+Q", click: function () { app.quit(); } }
            ]
        }, {
            label: "Edit",
            submenu: [
                { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
                { label: "Redo", accelerator: "Shift+CmdOrCtrl+Y", selector: "redo:" },
                { type: "separator" },
                { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
                { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
                { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
                { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" },
                { type: "separator" },
                { label: 'Zoom Reset', accelerator: 'CmdOrCtrl+0', click: () => { this.zoomReset(); } },
                { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', click: () => { this.zoomIn(); } },
                { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: () => { this.zoomOut(); } }
            ]
        }
        ];

        Menu.setApplicationMenu(Menu.buildFromTemplate(template));

        this.activeWindow = this.onedrive;
        this.show();
    }

    zoomOut() {
        this.mail.webContents.getZoomLevel((level) => {
            level = level - 1;
            this.mail.webContents.setZoomLevel(level);
            this.calendar.webContents.setZoomLevel(level);
            this.people.webContents.setZoomLevel(level);
            this.files.webContents.setZoomLevel(level);
            this.onedrive.webContents.setZoomLevel(level);
        });
    }

    zoomIn() {
        this.mail.webContents.getZoomLevel((level) => {
            level = level + 1;
            this.mail.webContents.setZoomLevel(level);
            this.calendar.webContents.setZoomLevel(level);
            this.people.webContents.setZoomLevel(level);
            this.files.webContents.setZoomLevel(level);
            this.onedrive.webContents.setZoomLevel(level);
        });
    }

    zoomReset() {
        this.mail.webContents.setZoomLevel(0);
        this.calendar.webContents.setZoomLevel(0);
        this.people.webContents.setZoomLevel(0);
        this.files.webContents.setZoomLevel(0);
        this.onedrive.webContents.setZoomLevel(0);
    }

    createWindow(target) {
        // Create the browser window.
        var window = new BrowserWindow({
            x: 100,
            y: 100,
            width: 1400,
            height: 900,
            frame: true,
            autoHideMenuBar: true,
            show: false,
            icon: path.join(__dirname, '../../assets/office_linux_black.png'),
            webPreferences: { nodeIntegration: false }
        })

        // and load the index.html of the app.
        window.loadURL(target)

        // insert styles
        window.webContents.on('dom-ready', () => {
            window.webContents.insertCSS(CssInjector.main)

        })

        // prevent the app quit, hide the window instead.
        window.on('close', (e) => {
            if (window.isVisible()) {
                e.preventDefault()
                window.hide();
            }
        })

        // on navigate events
        window.webContents.on('will-redirect', (e, url) => this.onWillRedirect(e, url));
        window.webContents.on('will-navigate', (e, url) => this.onWillNavigate(e, url));
        window.webContents.on('new-window', (e, url) => this.onNewWindow(e, url));
        window.webContents.on('did-navigate', (e, url) => this.onDidNavigate(e, url));
        //window.webContents.openDevTools();
        return window;
    }

    reload() {
        this.mail.loadURL(outlookUrl + '/mail');
        this.calendar.loadURL(outlookUrl + '/calendar');
        this.people.loadURL(outlookUrl + '/people');
        this.files.loadURL(outlookUrl + '/files');
        this.onedrive.loadURL(officeUrl);
    }

    toggleWindow() {
        if (this.activeWindow.isFocused())
            this.activeWindow.hide();
        else
            this.activeWindow.show();
    }

    setActiveWindow(targetWindow) {
        if (this.activeWindow == targetWindow) {
            return;
        }

        let position = this.activeWindow.getPosition();
        targetWindow.hide();
        targetWindow.setPosition(position[0], position[1]);
        targetWindow.setBounds(this.activeWindow.getBounds());

        targetWindow.setFullScreen(this.activeWindow.isFullScreen());

        if (this.activeWindow.isMaximized())
            targetWindow.maximize();
        else if (this.activeWindow.isMinimized())
            targetWindow.minimize();
        else
            targetWindow.unmaximize();

        this.activeWindow.hide();
        this.activeWindow = targetWindow;
        this.activeWindow.show();
        this.activeWindow.focus();
    }

    onDidNavigate(e, url) {
        if (!this.sso && url.startsWith("https://login.microsoftonline.com/login.srf")) {
            console.log(`onDidNavigate: ${url} ${this.activeWindow.getTitle()}`);
            this.sso = true;
            if (this.activeWindow != this.mail) {
                console.log("reload sso");
                this.mail.loadURL(outlookUrl + '/mail');
            }
            if (this.activeWindow != this.calendar) {
                console.log("reload sso");
                this.calendar.loadURL(outlookUrl + '/calendar');
            }
            if (this.activeWindow != this.people) {
                console.log("reload sso");
                this.people.loadURL(outlookUrl + '/people');
            }
            if (this.activeWindow != this.files) {
                console.log("reload sso");
                this.files.loadURL(outlookUrl + '/files');
            }

            if (this.activeWindow != this.onedrive) {
                console.log("reload sso");
                this.files.loadURL(officeUrl);
            }
        }
    }

    onWillRedirect(e, url) {
        console.log(`onWillRedirect: ${url} ${this.activeWindow.getTitle()}`);


        if (url.startsWith('https://www.office.com/launch/') || url.indexOf('sharepoint.com')>0) {
            if (url.indexOf('/launch/excel/') > 0 || url.indexOf('.xlsx') > 0) {
                this.onedrive.setIcon(path.join(__dirname, '../../assets/excel_linux_black.png'))
            } else  if (url.indexOf('/launch/word/') > 0 || url.indexOf('.docx') > 0) {
                this.onedrive.setIcon(path.join(__dirname, '../../assets/word_linux_black.png'))
            } else  if (url.indexOf('/launch/powerpoint/') > 0 || url.indexOf('.pptx') > 0) {
                this.onedrive.setIcon(path.join(__dirname, '../../assets/powerpoint_linux_black.png'))
            } else  if (url.indexOf('/launch/onenote/') > 0 ) { //Don't knowhow to do this one...
                this.onedrive.setIcon(path.join(__dirname, '../../assets/onenote_linux_black.png'))
            } else {
                this.onedrive.setIcon(path.join(__dirname, '../../assets/office_linux_black.png'))
            }
        return;
        }


    }



    onWillNavigate(e, url) {
        console.log(`onWillNavigate: ${url} ${this.activeWindow.getTitle()}`);
       
        let isOutlook = false;
        for(var outlookUrl of outlookUrls)
        {
            if (url.indexOf(outlookUrl) > 0)
            {
                isOutlook = true;
                break;
            }
        } 

        //To do: This needs to be generalized for anyone using adfs
        if (url.startsWith("https://msft.sts.microsoft.com/adfs/ls/?wa=wsignout1.0")) {
            console.log('quit');
            this.mail.close();
            this.calendar.close();
            this.people.close();
            this.files.close();
            this.onedrive.close();
            app.quit();
            e.preventDefault();
            return;
        }  else if (isOutlook && url.indexOf('/mail') > 0 && url.indexOf("?authRedirect=true") < 0) {
            if (this.activeWindow == this.mail) {
                e.preventDefault()
                return;
            }
            e.preventDefault()
            console.log('show mail');
            this.setActiveWindow(this.mail);
            return;
        } else if (isOutlook && url.indexOf('/calendar') > 0 && url.indexOf("?authRedirect=true") < 0) {
            if (this.activeWindow == this.calendar) {
                e.preventDefault()
                return;
            }
            e.preventDefault()
            console.log('show calendar');
            this.setActiveWindow(this.calendar);
            return;
        } else if (isOutlook && url.indexOf('/people') > 0 && url.indexOf("?authRedirect=true") < 0) {
            if (this.activeWindow == this.people) {
                e.preventDefault()
                return;
            }
            e.preventDefault()
            console.log('show people');
            this.setActiveWindow(this.people);
            return;
        } else if (isOutlook && url.indexOf('/files') > 0 && url.indexOf("?authRedirect=true") < 0) {
            if (this.activeWindow == this.files) {
                e.preventDefault()
                return;
            }
            e.preventDefault()
            console.log('show files');
            this.setActiveWindow(this.files);
            return;
            // } else if (url.indexOf('/to-do') > 0) {
            //     if (this.active == this.todos) {
            //         return;
            //     }
            //     e.preventDefault()
            //     console.log('show todos');
            //     this.setActiveWindow(this.todos);
            //     return;
        }
        //To do: Needs to be generalized for anyone using adfs
        else if (url.startsWith("https://msft.sts.microsoft.com/adfs/ls/?wa=wsignout1.0")) {
            e.preventDefault();
            return;
        }
        // else  if (url.startsWith("https://msft.sts.microsoft.com/adfs/")) {
        //     this.setActiveWindow(this.onedrive);
        //     return;
        // }
        return;
    }

    onNewWindow(e, url) {
        console.log(`onShowWindow: ${url} ${this.activeWindow.getTitle()}`);

        if (new RegExp(deeplinkUrls.join('|')).test(url)) {
            // Default action - if the user wants to open mail in a new window - let them.
            console.log('default action');
            return;
        }

        if (url.indexOf('sharepoint.com')  || url.startsWith('https://www.office.com/') ) {
            if (this.activeWindow == this.onedrive) {
                this.onedrive.loadURL(url);
                e.preventDefault()
                this.onedrive.setIcon(path.join(__dirname, '../../assets/office_linux_black.png'))   
                return;
            }
            e.preventDefault()
            console.log('show onedrive');
            this.setActiveWindow(this.onedrive);
            this.onedrive.loadURL(url);
            this.onedrive.setIcon(path.join(__dirname, '../../assets/office_linux_black.png'))   
            return;
        } else if (url.indexOf('https://sharepoint.com/') ) {
            if (this.activeWindow == this.onedrive) {
                e.preventDefault();
                this.onedrive.loadURL(url);                
                return;
            }
            e.preventDefault()
            console.log('show onedrive');
            this.setActiveWindow(this.onedrive);
            this.onedrive.loadURL(url);


            return;
        }
        // load external urls outside of app
        e.preventDefault()
        shell.openExternal(url)
    }

    show() {
        this.calendar.hide();
        this.people.hide();
        this.files.hide();
        this.mail.hide();
        //this.todos.hide();
        this.onedrive.show();
        this.onedrive.focus();
        this.activeWindow = this.onedrive;
    }
}

module.exports = MailWindowController

