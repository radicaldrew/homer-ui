import { Component, OnInit, ViewChild, AfterViewInit, Output, EventEmitter, Input } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { SearchRemoteService, PreferenceAdvancedService, SmartService } from '@app/services';

@Component({
    selector: 'app-code-style-smart-input-field',
    templateUrl: './code-style-smart-input-field.component.html',
    styleUrls: ['./code-style-smart-input-field.component.css']
})
export class CodeStyleSmartInputFieldComponent implements OnInit, AfterViewInit {
    divHTML: string;
    divText: string;
    serverLoki: string;
    editor: HTMLElement;
    isLabel = true;
    _queryText: string;

    lokiConnectionDisapper = false;

    menuTitle: string;
    private _menuDOM: HTMLElement;
    private lastMenuXPosition = 0;
    @Input() apiLink: string;
    @Input() set queryText(val) {
        this._queryText = val;
        this.updateEditor(null);
    }
    get queryText() {
        return this._queryText;
    }
    @Output() updateData: EventEmitter<any> = new EventEmitter();
    @Output() keyEnter: EventEmitter<any> = new EventEmitter();
    @ViewChild('divContainer', {static: false}) divContainer;
    @ViewChild(MatMenuTrigger, {static: false}) trigger: MatMenuTrigger;

    popupList: Array<string>;

    constructor(
        private _pas: PreferenceAdvancedService,
        private _srs: SearchRemoteService,
        private smartService: SmartService
    ) {
        const subscription = this._pas.getAll().subscribe((data: any) => {
            this.serverLoki = data.data
                .filter(i => i.category === 'search' && i.param === 'lokiserver')
                .map(i => i.data.host)[0];
            this.updateEditor(null);
            subscription.unsubscribe();
        });
    }

    ngOnInit() {
    }
    ngAfterViewInit () {
        this.editor = this.divContainer.nativeElement;
        this.editor.addEventListener('input', this.updateEditor.bind(this));
        if (this.queryText) {
            this.editor.innerText = this.queryText;
            this.updateEditor(null);
        }
    }
    async getLabels() {
        try {
            this.menuTitle = 'Labels';
            this.popupList = ['loading...'];
            this.trigger.openMenu();
            this.setMenuXPosition();
            this.editor.focus();

            // console.log(this.apiLink);
            const labelsData: any = (await this.smartService.getLabelByUrl(this.apiLink).toPromise());
            let labels: Array<string> = [];
            if (labelsData && labelsData.data && labelsData.data.length > 0) {
                labels = labelsData.data.map(i => i.value);
            }
            
            console.log({labels});

            this.isLabel = true;
            if (labels.length === 0) {
                this.lokiConnectionDisapper = true;
                return;
            }
            this.lokiConnectionDisapper = false;

            const readyAdded = this.getObject(this.editor.innerText);

            this.popupList = labels.filter(i => {
                return Object.keys(readyAdded).indexOf(i) === -1;
            });

            if ( this.popupList.length > 0) {
                this.trigger.openMenu();
                this.setMenuXPosition();
                this.editor.focus();
            } else {
                this.trigger.closeMenu();
            }
        } catch (error) {
            console.error({error});
        }
    }
    // async getVariabls (label: string = null) {
    //     label = label || this.editor.innerText.split(',').pop().replace(/[\=\"\,\{\}]+/g, '');
    //     try {
    //         setTimeout(() => {
    //             this.isLabel = false;
    //             this.popupList = ['loading...'];
    //             this.menuTitle = `Label value for "${label}"`;
    //             this.trigger.openMenu();
    //             this.setMenuXPosition();
    //             this.editor.focus();
    //         }, 0);

    //         this.popupList = await this._srs.getValues(label, this.serverLoki).toPromise();

    //         this.isLabel = false;
    //         if ( this.popupList.length > 0) {
    //             this.menuTitle = `Label value for "${label}"`;
    //             this.trigger.openMenu();
    //             this.setMenuXPosition();
    //             this.editor.focus();
    //         } else {
    //             this.trigger.closeMenu();
    //         }
    //     } catch (error) {
    //         console.error({error});
    //     }
    // }
    private setMenuXPosition() {
        if (this.getCaretPosition() === -1) {
            return;
        }
        if (!this._menuDOM) {
            this._menuDOM = document.querySelector('*[id^=cdk-overlay]');
            setTimeout(() => {
                this._menuDOM.style.marginTop = '-18px';
                this.setMenuXPosition();
            }, 0);
            return;
        }
        const x0 = this._menuDOM.getBoundingClientRect().left - (parseInt(this._menuDOM.style.marginLeft, 10) || 0);

        this._menuDOM.style.marginLeft = (this.getCaretPosition() - x0) + 'px';
    }
    triggerNavMenu(action: string = null) {
        switch (action) {
            case 'ArrowUp': case 'ArrowDown':
                this.trigger.menu.focusFirstItem();
                break;
            case 'Enter':
                if (!this.trigger.menuOpen) {
                    this.keyEnter.emit();
                }
                break;
        }
    }
    onKeyDownDiv(event) {
        if (!!({ArrowDown: 1, ArrowUp: 1, Enter: 1})[event.key]) {
            this.triggerNavMenu(event.key);
            event.preventDefault();
            return;
        }

    }
    onKeyUpDiv(event) {
        console.log('key UP event.keyCode=', event.keyCode);
        // 16 - Shift
        // 13 - Enter
        // 17 - Ctrl
        if (16 === event.keyCode) {
            return;
        }
        if (this.editor.innerText === '' || [17, 16].indexOf(event.keyCode) !== -1) {
            this.trigger.closeMenu();
            return;
        }
        if (!!({ArrowDown: 1, ArrowUp: 1, Enter: 1})[event.key]) {
            this.triggerNavMenu(event.key);
            event.preventDefault();
            return;
        }

        if ([8, 221].indexOf(event.keyCode) !== -1) {
            if (')}]'.indexOf(this.editor.innerText[0]) !== -1) {
                this.editor.innerText = this.editor.innerText.slice(1);
            }
            if (this.editor.innerText === '') {
                this.trigger.closeMenu();
                return;
            }
            event.preventDefault();
            return false;
        }
        if ([219, 222, 188, 187, 192, 190].indexOf(event.keyCode) !== -1) {
            const getLastLetter = window.getSelection().anchorNode.textContent.split('')[0];

            if ('.' === getLastLetter) {
                // this.editor.innerText = '()';
                this.updateEditor(null);
                // this.restoreSelection(1, 1);
            }
            
            if ('="'.indexOf(getLastLetter) !== -1) { // '=' | '"'
                // this.getVariabls();
            } else {
                const o = this.getObject(this.editor.innerText);
                const _label = Object.keys(o).filter(i => o[i] === null);
                if (_label.length > 0) {
                    // this.getVariabls(_label[0]);
                } else {
                    this.getLabels();
                }
            }
            this.editor.focus();
        } else {
            this.trigger.closeMenu();
        }
    }
    private getCaretPosition() {
        try {
            const d = window.getSelection().anchorNode.parentNode as HTMLElement;
            this.lastMenuXPosition = Math.round( d.getBoundingClientRect().left );
            return Math.round( d.getBoundingClientRect().left );
        } catch (e) {
            return -1;
        }
    }
    getObject (str: string) {
        if (str.match(/\{.*\}/g)) {
            str = str.match(/\{.*\}/g)[0];
        }
        const json = str.replace(/\{|\}/g, '')
            .split(',')
            .map(i => {
                if (i.indexOf('=') === -1) {
                    i += ':';
                }
            return i;
            }).join(',')
            .replace(/\=/g, ':')
            .replace(/[a-zA-Z-]+/g, (a, b) => `"${a}"`)
            .replace(/\"\"/g, '"')
            .replace(/\s/g, '')
            .replace(/^.*$/g, a => `{${a}}`)
            .replace(',}', '}')
            .replace(':}', ': null}')
            .replace('":"}', '": null}')
            .replace('",: null}', '"}');
            try {
                if (json === '{: null}') {
                    return {};
                }
                return JSON.parse(json);
            } catch (e) {
                return json;
            }
    }
    getRegExpString(str) {
        return str.split(/\{.*\}\s*/g)[1] || '';
    }
    onMenuMessage (item, event: any = null) {
        if (!event || (event.keyCode === 13 || event.keyCode === 32 )) {
            if (this.isLabel ) {
                item = item.split('.')[1];
                this.typeInTextarea(item + '=');
                this.updateEditor(null, true);
                const c = this.editor.innerText.length - 1;
                // this.restoreSelection(c, c);
                // this.getVariabls();
            } else {
                this.typeInTextarea(`"${item}"`);
                this.updateEditor(null);
                const c = this.editor.innerText.length - 1;
                // this.restoreSelection(c, c);
            }
        }
        if (event && event.keyCode === 27) {
            this.trigger.closeMenu();
        }
    }

    private setStyleCodeColors(str) {
        const s = str.match(/([\=\>\<]{1,3}[A-Za-z\d_]+)|(\.[A-Za-z\d_]+)|([A-Za-z\d_]+)|([^A-Za-z\d_]+)/g);
        // console.log(s);
        if (!s) {
            return '';
        }
        return s.map(i => {
            let cssClass = 'SIwhite';
            if ('{}[]()'.indexOf(i) !== -1) {
                cssClass = 'SIbracket';
            } else if ('!@#$%^&.,'.indexOf(i) !== -1) {
                cssClass = 'SIequally';
            // } else if (i.match(/[\"\'\`]+/g)) {
            //     cssClass = 'SIquotes';
            } else if (i.match(/[\=\>\<]{1,3}[a-zA-Z\d_]+/g)) {
                cssClass = 'SIwhite';
            } else if (i.match(/\.[a-zA-Z_]+/g)) {
                cssClass = 'SIquotes';
            } else if (i.match(/[a-zA-Z_]+/g)) {
                cssClass = 'SIlabel';
            }
            const span = document.createElement('span');
            span.classList.add(cssClass);
            span.innerText = i;

            return span.outerHTML;
        }).join('');
    }

    private getTextSegments (element) {
        const textSegments = [];
        try {
            Array.from(element.childNodes).forEach((node: Node) => {
                switch (node.nodeType) {
                    case Node.TEXT_NODE:
                        textSegments.push({text: node.nodeValue, node});
                        break;

                    case Node.ELEMENT_NODE:
                        textSegments.splice(textSegments.length, 0, ...(this.getTextSegments(node)));
                        break;

                    default:
                        throw new Error(`Unexpected node type: ${node.nodeType}`);
                }
            });
        } catch (err) { }
        return textSegments;
    }

    private updateEditor(event, setEnd = false) {
        const sel = window.getSelection();
        const textSegments = this.getTextSegments(this.editor);
        const textContent = textSegments.map(({text}) => text).join('');
        let anchorIndex = null;
        let focusIndex = null;
        let currentIndex = 0;
        textSegments.forEach(({text, node}) => {
            if (node === sel.anchorNode) {
                anchorIndex = currentIndex + sel.anchorOffset;
            }
            if (node === sel.focusNode) {
                focusIndex = currentIndex + sel.focusOffset;
            }
            currentIndex += text.length;
        });

        try {
            this.editor.innerHTML = this.setStyleCodeColors(textContent); // this.renderText(textContent);
        } catch (err) { }

        if (setEnd) {
            this.restoreSelection(this.editor.innerText.length, this.editor.innerText.length);
        } else {
            this.restoreSelection(anchorIndex, focusIndex);
        }
        if (this.serverLoki) {
            this.updateData.emit({
                text: textContent,
                serverLoki: this.serverLoki,
                obj: this.getObject(textContent),
                rxText: this.getRegExpString(textContent)
            });
        }
    }

    private restoreSelection(absoluteAnchorIndex, absoluteFocusIndex) {
        const sel = window.getSelection();
        const textSegments = this.getTextSegments(this.editor);
        let anchorNode = this.editor;
        let anchorIndex = 0;
        let focusNode = this.editor;
        let focusIndex = 0;
        let currentIndex = 0;

        textSegments.forEach(({text, node}) => {
            const startIndexOfNode = currentIndex;
            const endIndexOfNode = startIndexOfNode + text.length;
            if (startIndexOfNode <= absoluteAnchorIndex && absoluteAnchorIndex <= endIndexOfNode) {
                anchorNode = node;
                anchorIndex = absoluteAnchorIndex - startIndexOfNode;
            }
            if (startIndexOfNode <= absoluteFocusIndex && absoluteFocusIndex <= endIndexOfNode) {
                focusNode = node;
                focusIndex = absoluteFocusIndex - startIndexOfNode;
            }
            currentIndex += text.length;
        });

        sel.setBaseAndExtent(anchorNode, anchorIndex, focusNode, focusIndex);
    }
    private typeInTextarea(str) {
        const sel = window.getSelection() as Selection;
        const el = sel.anchorNode.parentNode as HTMLElement;
        const start = sel['baseOffset'];
        const end = sel['extentOffset'];
        const text = el.innerText;
        const before = text.substring(0, start);
        const after  = text.substring(end, text.length);
        el.innerText = (before + str + after);
        el.focus();
        return false;
    }
}