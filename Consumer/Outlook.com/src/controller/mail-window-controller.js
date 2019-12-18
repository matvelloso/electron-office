const { BrowserWindow, shell, ipcMain, Menu } = require('electron')
const settings = require('electron-settings')
const CssInjector = require('../js/css-injector')
const path = require('path')

const outlookUrl = 'https://outlook.live.com'
const deeplinkUrls = ['outlook.live.com/mail/deeplink', 'outlook.office365.com/mail/deeplink', 'outlook.office.com/mail/deeplink']
const outlookUrls = ['outlook.live.com', 'outlook.office365.com', 'outlook.office.com']

class MailWindowController {
    constructor() {
        this.init()
    }

    init() {
        // Get configurations.
        const showWindowFrame = settings.get('showWindowFrame', true)
        this.mail = this.createWindow(outlookUrl + '/mail?nlp=1');
        this.calendar = this.createWindow(outlookUrl + '/calendar?nlp=1');
        this.people = this.createWindow(outlookUrl + '/people?nlp=1');
        this.files = this.createWindow(outlookUrl + '/files?nlp=1');
        //this.todos = this.createWindow('https://to-do.microsoft.com/?fromOwa=true');

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

        this.activeWindow = this.mail;
        this.show();
    }

    zoomOut() {
        this.mail.webContents.getZoomLevel((level) => {
            level = level - 1;
            this.mail.webContents.setZoomLevel(level);
            this.calendar.webContents.setZoomLevel(level);
            this.people.webContents.setZoomLevel(level);
            this.files.webContents.setZoomLevel(level);
        });
    }

    zoomIn() {
        this.mail.webContents.getZoomLevel((level) => {
            level = level + 1;
            this.mail.webContents.setZoomLevel(level);
            this.calendar.webContents.setZoomLevel(level);
            this.people.webContents.setZoomLevel(level);
            this.files.webContents.setZoomLevel(level);
        });
    }

    zoomReset() {
        this.mail.webContents.setZoomLevel(0);
        this.calendar.webContents.setZoomLevel(0);
        this.people.webContents.setZoomLevel(0);
        this.files.webContents.setZoomLevel(0);
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
            icon: path.join(__dirname, '../../assets/outlook_linux_black.png'),
            webPreferences: { nodeIntegration: false, sandbox: true, contextIsolation: true, enableRemoteModule: false}
        })

        // and load the index.html of the app.
        window.loadURL(target)

        // insert styles
        window.webContents.on('dom-ready', () => {
            window.webContents.insertCSS(CssInjector.main)
            //if (!showWindowFrame) window.webContents.insertCSS(CssInjector.noFrame)

            // this.addUnreadNumberObserver()
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
        //window.webContents.openDevTools();
        return window;
    }

    reload() {
        this.mail.loadURL(outlookUrl + '/mail?nlp=1');
        this.calendar.loadURL(outlookUrl + '/calendar?nlp=1');
        this.people.loadURL(outlookUrl + '/people?nlp=1');
        this.files.loadURL(outlookUrl + '/files?nlp=1');
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

    onWillRedirect(e, url) {
        console.log(`onWillRedirect: ${url} ${this.activeWindow.getTitle()}`);

        if (url.startsWith("https://outlook.live.com/owa/auth/dt.aspx")) {
            console.log('refresh on login');
            if (this.activeWindow != this.mail && this.mail.webContents.getURL().indexOf("login") > 0) {
                this.mail.loadURL(outlookUrl + '/mail?nlp=1');
            }
            if (this.activeWindow != this.calendar && this.calendar.webContents.getURL().indexOf("login") > 0) {
                this.calendar.loadURL(outlookUrl + '/calendar?nlp=1');
            }
            if (this.activeWindow != this.people && this.people.webContents.getURL().indexOf("login") > 0) {
                this.people.loadURL(outlookUrl + '/people?nlp=1');
            }
            if (this.activeWindow != this.files && this.files.webContents.getURL().indexOf("login") > 0) {
                this.files.loadURL(outlookUrl + '/files?nlp=1');
            }
            return;
        }

        if (url.indexOf("www.msn.com") > 0 && url.indexOf("ocid=mailsignout") > 0) {
            e.preventDefault();
            console.log('reload');
            this.reload();
            return;
        }

        return;
    }

    onWillNavigate(e, url) {
        console.log(`onWillNavigate: ${url} ${this.activeWindow.getTitle()}`);

        if (url.startsWith("https://outlook.live.com/owa/logoff.owa") ||
            url.startsWith("https://login.live.com/logout.srf") ||
            url.startsWith("https://outlook.live.com/owa/csignout.aspx")) {
            console.log('loading in window1');
            e.preventDefault()
            this.activeWindow.loadURL(url);
            return;
        }
        else if (url.startsWith("https://login.live.com/login.srf")) {
            console.log('loading in window2');
            e.preventDefault()
            this.activeWindow.loadURL(url);
            return;
        }
        return;
    }

    onNewWindow(e, url) {
        console.log(`onShowWindow: ${url} ${this.activeWindow.getTitle()}`);

        if (new RegExp(deeplinkUrls.join('|')).test(url)) {
            // Default action - if the user wants to open mail in a new window - let them.
            console.log('default action');
            return;
        }

        if (url.indexOf('/mail') > 0) {
            if (this.activeWindow == this.mail) {
                e.preventDefault()
                return;
            }
            e.preventDefault()
            console.log('show mail');
            this.setActiveWindow(this.mail);
            return;
        } else if (url.indexOf('/calendar') > 0) {
            if (this.activeWindow == this.calendar) {
                e.preventDefault()
                return;
            }
            e.preventDefault()
            console.log('show calendar');
            this.setActiveWindow(this.calendar);
            return;
        } else if (url.indexOf('/people') > 0) {
            if (this.activeWindow == this.people) {
                e.preventDefault()
                return;
            }
            e.preventDefault()
            console.log('show people');
            this.setActiveWindow(this.people);
            return;
        } else if (url.indexOf('/files') > 0) {
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

        // load external urls outside of app
        e.preventDefault()
        shell.openExternal(url)
    }

    show() {
        this.calendar.hide();
        this.people.hide();
        this.files.hide();
        //this.todos.hide();
        this.mail.show();
        this.mail.focus();
        this.activeWindow = this.mail;
    }
}

module.exports = MailWindowController

