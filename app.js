/**
 * This is the main file of mecEdit. You can find this app on {@link https://github.com/jauhl/mecEdit GitHub}.
 * @name mecEdit
 * @author Jan Uhlig
 * @copyright Jan Uhlig 2018
 * @license MIT
 * @requires examples.js
 * @requires ctxm-templates.js
 * @requires appevents.js
 * @requires g2.editor.js
 * @requires mixin.js
 * @requires mec2.js
 * @requires g2.js
 */

'use strict';

const tooltip = document.getElementById('info'),
    actcontainer = document.getElementById('actuators-container'),
    // statusbar
    statusbar = document.getElementById('statbar'),
    sbMode =  document.getElementById('sbMode'),
    sbCoords =  document.getElementById('sbCoords'),
    sbCartesian =  document.getElementById('sbCartesian'),
    sbBtn =  document.getElementById('sbBtn'),
    sbDbtn =  document.getElementById('sbDbtn'),
    sbFPS =  document.getElementById('sbFPS'),
    sbState =  document.getElementById('sbState'),
    sbDragging =  document.getElementById('sbDragging'),
    sbDragmode =  document.getElementById('sbDragmode'),
    sbDOF =  document.getElementById('sbDOF'),
    sbGravity =  document.getElementById('sbGravity'),

    editor = g2.editor(),
    pi = Math.PI;

const origin = g2().beg({ lc: 'round', lj: 'round', ls:()=>mec.darkmode?'silver':'slategray', fs: 'darkgray' })
                        .p()
                            .m({ x: 21, y: 0 })
                            .l({ x: 0, y: 0 })
                            .l({ x: 0, y: 21 })
                        .stroke()
                        .p()
                            .m({ x: 35, y: 0 })
                            .l({ x: 21, y: -2.6 })
                            .a({ dw: pi/3, x: 21, y: 2.6 })
                        .z()
                            .m({ x: 0, y: 35 })
                            .l({ x: 2.6, y: 21 })
                            .a({ dw: pi/3, x: -2.6, y: 21 })
                        .z()
                        .drw()
                        .cir({ x: 0, y: 0, r: 2.5, fs: '#ccc' })
                    .end()
                    .beg({ ls:()=>mec.darkmode?'silver':'slategray', font: '14px roboto'})
                        .txt({str:'x', x: 38, y: 4})
                        .txt({str:'y', x: 6, y: 30})
                    .end();
                    
const gravvec = (cartesian = true) => {
    const ytxt = cartesian ? - 20 : -15;
    return g2().beg({ w: -pi/2, lw: 2, ls:()=>mec.darkmode?'silver':'slategray', fs: 'darkgray'})
               .p()
                   .m({ x: 0, y: 0 })
                   .l({ x: 50, y: 0 })
               .stroke()
               .p()
                   .m({ x: 50, y: 0 })
                   .l({ x: 50 - 17.5, y: -3.5 })
                   .a({ dw: pi/3, x: 50 - 17.5, y: 3.5 })
               .z()
               .drw()
            .end()
            .beg({ ls:()=>mec.darkmode?'silver':'slategray', font: '14px roboto'})
                .txt({str:'g', x: -15, y: ytxt})
            .end();
};

const App = {
    create() {
        const o = Object.create(this.prototype);
        o.constructor.apply(o, arguments);
        return o;
    },
    prototype: Object.assign({
        constructor() {
            this.model = {
                id: 'linkage',
                // gravity: false,
                // nodes: [
                //     { id:"A",x:72,y:310,base:true },
                //     { id:"B",x:562,y:309,base:true },
                //     { id:"C",x:71,y:401 },
                //     { id:"D",x:670,y:534 },
                //     { id:"E",x:273,y:595 }
                //   ],
                // constraints: [
                //     { id:"b",p1:"C",p2:"D",len:{ type:"const" } },
                //     { id:"c",p1:"D",p2:"B",len:{ type:"const" } },
                //     { id:"d",p1:"C",p2:"E",len:{ type:"const" },ori:{ type:"ref",ref:"b" } },
                //     { id:"a",p1:"A",p2:"C",len:{ type:"const" },ori:{ type:"drive",Dt:3,Dw:6.283185307179586,repeat:1000 } }
                //   ],
                // views: [
                //     { type:"info",id:"view1",elem:"D",value:"vel" },
                //     { type:"info",id:"view2",elem:"b",value:"w" },
                //     { type:"trace",id:"view3",p:"E",stroke:"#ff0000",fill:"#009900" }
                // ]
            };
            // this.model = {
            //     id: '5bar',
            //     gravity: false,
            //     nodes: [
            //         {id:'A0',x:100,y:100,base:true},
            //         {id:'A',x:100,y:150},
            //         {id:'B',x:350,y:220},
            //         {id:'B0',x:300,y:100,base:true},
            //         {id:'C',x:400,y:350},
            //         {id:'D',x:550,y:150},
            //         {id:'D0',x:500,y:100,base:true}
            //     ],
            //     constraints: [
            //         { id:'a',p1:'A0',p2:'A',len:{type:'const'},ori:{type:'drive',func:'sinoid',Dt:50,Dw:2*Math.PI,input:true} },
            //         { id:'b',p1:'A', p2:'B',len:{type:'const'} },
            //         { id:'c',p1:'B0', p2:'B',len:{type:'const'} },
            //         { id:'d',p1:'B', p2:'C',len:{type:'const'} },
            //         { id:'e',p1:'C', p2:'D',len:{type:'const'} },
            //         { id:'f',p1:'D0', p2:'D',len:{type:'const'},ori:{type:'drive',func:'sinoid',Dt:50,Dw:2*Math.PI,input:true} }
            //     ]
            // };

            this.VERSION = '0.4.9.2';

            // mixin requiries ...
            this.evt = { dx: 0, dy: 0, dbtn: 0 };
            this.view = { x: 150, y: 150, scl: 1, cartesian: true };

            this.cnv = document.getElementById('canvas');
            this.ctx = this.cnv.getContext('2d');
            this.instruct = document.getElementById('instructions');
            this.ctxmenu = document.getElementById('contextMenu');
            this.ctxmenuheader = document.getElementById("contextMenuHeader");
            this.ctxmenubody = document.getElementById("contextMenuBody");

            // states
            this.build = false;  // build state
            this.tempElm = false;  // ctxm state

            this.devmode = false;
            this.importConfirmed = false; // skip conformdialogue helper
            this.dragMove = true;
            this.nodeInfoValues = ['acc','accAbs','dof','energy','force','forceAbs','vel','velAbs'];
            this.constraintInfoValues = ['w','dof','forceAbs','moment'];
            this.nodeVectorValues = ['acc','energy','force','vel']; // or objects only?

            this.g = g2();

            this.registerEventsFor(this.ctx.canvas)
                .on(['pointer', 'drag', 'buttondown', 'buttonup', 'click'], (e) => { this.g.exe(editor.on(this.pntToUsr(Object.assign({}, e)))).exe(this.ctx); })  // apply events to g2 ...
                .on(['pointer', 'drag', 'pan', 'fps', 'buttondown', 'buttonup', 'click', 'pointerenter', 'pointerleave'], () => this.showStatus())
                .on('drag', (e) => {
                    if (!this.dragMove) { // dragEdit mode
                        editor.curElm.x0 = editor.curElm.x;
                        editor.curElm.y0 = editor.curElm.y;
                    };
                    this.showTooltip(e);
                })
                .on('pan', (e) => {
                    this.pan(e);
                    this.g.exe(this.ctx);
                })
                .on('pointer',(e)=>this.showTooltip(e)) // show tooltip view info
                .on(['buttonup', 'click'], () => this.hideTooltip()) // hide tooltip info
                .on('buttondown', () => {
                    if (this.build) {
                        if (['addnode', 'addbasenode'].includes(this.build.mode)) this.addNode();
                        if (this.build.mode === 'purgenode') this.clearNode(editor.curElm);
                        if (['free', 'tran', 'rot'].includes(this.build.mode)) this.addConstraint();
                        if (this.build.mode === 'drive') this.addDrive(editor.curElm);
                        if (this.build.mode === 'force') this.addForce();
                        if (this.build.mode === 'spring') this.addSpring();
                        if (['fix', 'flt'].includes(this.build.mode)) this.addSupportShape();
                    }
                })
                .on('render', () => this.g.exe(this.ctx))
                .on('tick', (e) => this.tick(e));
            
            this.state = 'created';
        }, // constructor

        get cartesian() { return this.view.cartesian; },
        get height() { return this.ctx.canvas.height; },
        get dragging() { return !!(editor.curState & g2.DRAG) },

        showStatus() {
            let { x, y } = this.pntToUsr({ x: this.evt.x, y: this.evt.y });
            // statusbar.innerHTML = `mode=${this.evt.type}, x=${x}, y=${y}, cartesian=${this.cartesian}, btn=${this.evt.btn}, dbtn=${this.evt.dbtn}, fps=${this.fps}, state=${g2.editor.state[editor.curState]}, dragging=${this.dragging}, dragmode=${this.dragMove?'move':'edit'}, ${typeof this.model === 'object' ? `dof=${this.model.dof}, gravity=${this.model.hasGravity ? 'on' : 'off'}` : `` }`
            sbCoords.innerHTML = `x=${x}, y=${y}`;
            sbDragmode.innerHTML = `dragmode=${this.dragMove?'move':'edit'}`;
            sbFPS.innerHTML = `fps=${this.fps}`;
            if (!!this.model.nodes && this.model.nodes.length > 0 ) { // only useful when model has nodes
                sbDOF.innerHTML = `dof=${this.model.dof}`;
                if (this.devmode)
                    sbGravity.innerHTML = `gravity=${this.model.hasGravity ? 'on' : 'off'}`;
            } else {
                sbDOF.innerHTML = sbGravity.innerHTML = ``;
            };
            if (this.devmode) {
                sbMode.innerHTML = `mode=${this.evt.type}`;
                sbCartesian.innerHTML = `cartesian=${this.cartesian}`;
                sbBtn.innerHTML = `btn=${this.evt.btn}`;
                sbDbtn.innerHTML = `dbtn=${this.evt.dbtn}`;
                sbState.innerHTML = `state=${g2.editor.state[editor.curState]}`;
                sbDragging.innerHTML = `dragging=${this.dragging}`;
            };            
        },

        showTooltip(e) {
            const info = this.model.info;
            tooltip.style.left = ((e.clientX) + 15) + 'px';
            tooltip.style.top = (e.clientY - 50) + 'px';
            // type of info
            if (editor.dragInfo && !this.dragMove) {
                tooltip.innerHTML = editor.dragInfo;
                tooltip.style.display = 'inline';
            } else if (info && this.dragMove) { // don't show views in dragEdit mode
                tooltip.innerHTML = info;
                tooltip.style.display = 'inline';
            }
            else
                this.hideTooltip();
        },

        hideTooltip() {
            tooltip.style.display = 'none';
        },

        tick(e) {
            if (!!this.model) { // check if model is defined first
                if (this.dragging) {
                    this.dragMove ? this.model.pose() : this.updDependants(editor.curElm); // null, if updating on dragend via editor
                    // this.model.pose();                  // try to bring mechanism to valid current pose
                    this.g.exe(this.ctx);
                }
                else if (this.state === 'active') {     // perform time step
                    this.model.tick(e.dt);
                    if (!this.model.isActive)
                        this.stop();        // this causes state intentionally being set to 'idle' for model without gravity even when run was clicked
                    this.g.exe(this.ctx);
                }
                else if (this.state === 'input') {     // perform time step
                    this.model.tick(0);
                    this.g.exe(this.ctx);
                }
            }
        },

        init() { // evaluate how many actuators and add init add controlled properties to model instead of typing them there
            mec.model.extend(this.model);
            // this.model.dirty = true;
            this.model.init().asmPos();
            this.model.draw(this.g);

            this.model.drivecount = 0;  // add drive counter to model
            this.model.drives = [];     // track drives by id and dof for responsive range-input sizing

            let drv, prv=false;
            while (drv = this.driveByInput(prv)) {
                actcontainer.appendChild(this.createMecSlider(drv.constraint.id, (this.cnv.width - 150)/2));

                let elm = document.getElementById(`${drv.constraint.id}`);
                mecSlider.RegisterElm(elm);
                // console.log(drv);
                elm.initEventHandling(this, drv.constraint.id, this.model.constraintById(drv.constraint.id)[drv.value].inputCallbk );
                this.model.drivecount++;
                this.model.drives.push({id:drv.constraint.id,dof:drv.value});
                prv = drv;
            };

            // (this.mainLoop.ptr || (this.mainLoop.ptr = this.mainLoop.bind(this)))(this.mainLoop.t0 = performance.now());
            if (typeof t === 'undefined' || t === null) {  // dont start second timer if init() is called again
                this.startTimer() // startTimer ...             // start synchronized ticks 
                    .notify('render');                          // send 'render' event
            };

            this.state = (this.model.drivecount > 0) ? 'input' : 'initialized';
        },

        run() { this.state = 'active'; },
        idle() { this.state = 'idle'; },
        stop() {
            this.model.stop();
            this.state = 'idle'; 
        },
        reset() { 
            this.model.reset();

            // reset drive-inputs
            for (const drive in this.model.drives) {
                this.model.constraintById(this.model.drives[drive].id)[this.model.drives[drive].dof].inputCallbk({target:{value:0}}); // reset driven constraints
                document.getElementById(this.model.drives[drive].id).value = 0;
                this.notify(this.model.drives[drive].id,0);
            };

            this.notify('render');
            this.state = (this.model.drivecount > 0) ? 'input' : 'reset'; 
        },

        updDependants(elm) {
            // const dependants = this.model.dependentsOf(this); // currently only constraints need to be updated
            let dependants = [];
            for (const constraint of this.model.constraints) {
                if (constraint.dependsOn(elm))
                    dependants.push(constraint);
            }
            // dependants.forEach(el => el.init(this.model));
            dependants.forEach(el => {
                el.init(this.model);
                if (el.type === 'ctrl' && ( el.ori.type === 'drive' || el.len.type === 'drive' )) { // each init of constraint-drives multiplies 'Dt' with 'repeat', so this value either has to be saved and restored or simply canceled out by dividing ... 
                    if (!!el.ori.repeat)
                        el.ori.Dt /= el.ori.repeat;
                    if (!!el.len.repeat)
                        el.len.Dt /= el.len.repeat;
                };       
            });
        },

        toggleDarkmode() {
            mec.darkmode = !mec.darkmode;
            jsonEditor.setOption("theme",`${mec.darkmode ? 'lucario' : 'mdn-like'}`);
            this.cnv.style.backgroundColor = mec.darkmode ? '#344c6b' : 'rgb(250, 246, 209)';
            this.notify('render');
        },

        createActuatorElm(actuated, width) { // todo: currently only for ori
            let template = document.createElement('template')
            template.innerHTML = `<input type="range" id="${actuated}" class="mec-slider d-inline-flex nowrap ml-2 mr-1 mt-1" style="width:${width}px" min="0" max="${Math.round(mec.toDeg(this.model.constraintById(actuated).ori.Dw))}" step="1" value="0"></input>`
            return template.content.firstChild;
        },

        createMecSlider(actuated, width) {
            let template = document.createElement('template')
            template.innerHTML = `<mec-slider id="${actuated}" class="mec-slider d-inline-flex nowrap ml-2 mr-1 mt-1" width="${width}" min="0" max="360" step="1" value="" valstr="${actuated}={value}°"></mec-slider>`
            return template.content.firstChild;
        },

        createActuatorElm2(actuated, width) {
            let template = document.createElement('template')
            // template.innerHTML = `<mec-slider id="${actuated}" class="mec-slider d-inline-flex nowrap ml-2 mr-1 mt-1" width="${width}" min="0" max="360" step="1" value="" valstr="${actuated}={value}°"></mec-slider>`
            template.innerHTML = `<actuator><input id="${actuated}" type="range" style="min-width:${width}px;margin:0;" min="0" max="2" value="0" step="0.0055555"/><output id="${actuated}_out" style="width:4em; text-align:right;"></output></actuator>`
            console.log(template.content.firstChild);
            return template.content.firstChild;
        },

        // mainLoop(t) {
        //     if (this.model.dirty) { // model.dirty for inverse
        //         this.model.dirty = false;
        //         this.notify('step');
        //         this.notify('render');
        //     }
        //     requestAnimationFrame(this.mainLoop.ptr);
        // },

        updateg() {
            let apphasmodel = typeof this.model === 'object' && Object.keys(this.model).length ? true : false;

            this.g = g2().clr()
                .view(this.view)
                .grid({ color: ()=>mec.darkmode?'rgba(255, 255, 255, 0.1)':'rgba(0, 0, 0, 0.1)', size: 100 })
                .grid({ color: ()=>mec.darkmode?'rgba(255, 255, 255, 0.1)':'rgba(0, 0, 0, 0.1)', size: 20 })
                .p() // mark origin
                    .m({ x: () => -this.view.x / this.view.scl, y: 0 })
                    .l({ x: () => (this.cnv.width - this.view.x) / this.view.scl, y: 0 })
                    .m({ x: 0, y: () => -this.view.y / this.view.scl })
                    .l({ x: 0, y: () => (this.cnv.height - this.view.y) / this.view.scl })
                .z()
                .stroke({ ls: ()=>mec.darkmode?'rgba(255, 255, 255, 0.3)':'rgba(0, 0, 0, 0.2)', lw: 2 })
                .use({grp:origin,x: () => (10 - this.view.x)/this.view.scl, y: () => (10 - this.view.y)/this.view.scl, scl: () => this.view.scl});
                if(apphasmodel && this.model.hasGravity) {
                    if(this.cartesian) {
                        this.g.use({grp:gravvec(true),x: () => (this.cnv.width - 15 - this.view.x)/this.view.scl, y: () => (this.cnv.height - 15 - this.view.y)/this.view.scl, scl: () => this.view.scl});
                    } else {
                        this.g.use({grp:gravvec(false),x: () => (this.cnv.width - 15 - this.view.x)/this.view.scl, y: () => (- this.view.y + 69 )/this.view.scl, scl: () => this.view.scl});
                    };
                };

            if (apphasmodel)
                this.model.draw(this.g);
            this.notify('render')
        },

        resetApp() {
            app.build = false; // reset build state
            app.tempElm = false; // reset build state
            this.instruct.innerHTML = ''; // reset instructions
            this.notify('render');
        },

        replaceNode(oldN, newN) { // todo: bug: this function does not set the new mass in p1/p2 of adjacent constraints!!
            // this.model.nodes.splice(this.model.nodes.indexOf(oldN), 1); // remove old node from model
            // this.model.addNode(mec.node.extend(newN));
            // newN.init(this.model);
            // this.model.nodeById(newN.id).updAdjConstraints();
            // this.updateg(); // update graphics

            if (!(oldN.x === newN.x)) this.model.nodeById(oldN.id).x = newN.x;
            if (!(oldN.y === newN.y)) this.model.nodeById(oldN.id).y = newN.y;
            if (!(oldN.m === newN.m)) this.model.nodeById(oldN.id).m = newN.m;
            // this.model.dirty = true;
        },

        addNode() {
            if (editor.curElm === undefined || !editor.curElm.hasOwnProperty('m')) { // no node at coords; objects with a mass are considered nodes
                let { x, y } = this.pntToUsr({ x: this.evt.x, y: this.evt.y });
                let node = {
                    id: this.getNewChar(),
                    x: x,
                    y: y,
                    m: this.build.mode == 'addbasenode' ? Number.POSITIVE_INFINITY : 1
                };
                this.model.addNode(mec.node.extend(node)); // inherit prototype methods (extend) and add to model via model.addnode
                node.init(this.model);
                this.updateg(); // update graphics
            } else { // existing node at coords
                return;
            };
            
            if (!this.build.continue) {
                document.body.style.cursor = 'default';
                this.resetApp();
            };
        },

        clearNode(node) {  // remove passed node and all its dependants
            if (!!node && node.hasOwnProperty('m')) { // check if clicked object is a node
                app.model.purgeNode(node)

                this.updateg(); // update graphics

                document.body.style.cursor = 'default';
                this.resetApp();
            };           
        },

        replaceConstraint(oldC, newC) {
            this.reset();

            let addevlist = false;
            let drv = false;

            if (newC.ori.type === 'drive')
                drv = {newC, value:'ori'};

            if (!!oldC.ori && !!oldC.ori.input && !!document.getElementById(oldC.id)) { // remove old eventlistener for changed drives
                document.getElementById(oldC.id).removeEventListener('input',app.model.constraintById(oldC.id).ori.inputCallbk,false);
                if (!!newC.ori.input) // newC needs new eventlistener
                    addevlist = true;
            };

            this.model.constraints.splice(app.model.constraints.indexOf(app.model.constraintById(oldC.id)), 1); // remove old constraint
            this.model.addConstraint(mec.constraint.extend(newC)); // add new constraint
            newC.init(this.model); // init new constraint
            this.updateg(); // update graphics
            
            if (!!newC.ori.input && !document.getElementById(newC.id)) {
                actcontainer.appendChild(this.createMecSlider(drv.newC.id, (this.cnv.width - 350)/2));

                let elm = document.getElementById(`${drv.newC.id}`);
                mecSlider.RegisterElm(elm);
                // actcontainer.appendChild(this.createActuatorElm(newC.id, 400));
                this.model.drivecount++;
                this.model.drives.push({id:drv.newC.id,dof:drv.value});
                addevlist = true;
            } else if (!newC.ori.input && !!document.getElementById(newC.id)) {
                actcontainer.removeChild(document.getElementById(newC.id));
                this.model.drives.splice(this.model.drives.findIndex((el)=>el.id === newC.id),1)
                this.model.drivecount--;
            };

            if (addevlist) {
                document.getElementById(drv.newC.id).initEventHandling(this, drv.newC.id, this.model.constraintById(drv.newC.id)[drv.value].inputCallbk );
                // document.getElementById(drv.newC.id).addEventListener('input',newC[drv.value].inputCallbk,false);
            };
            this.state = (this.model.drivecount > 0) ? 'input' : 'initialized';
        },

        driveByInput(prev = false) {  // from microapp.js
            let found = false, start = !prev;
            for (const constraint of this.model.constraints) {
                if (constraint.ori && constraint.ori.type === 'drive' && constraint.ori.input) {
                    if (!start) start = constraint.ori === prev.constraint.ori;
                    else        found = {constraint, value:'ori'};
                }
                if (constraint.len && constraint.len.type === 'drive' && constraint.len.input) {
                    if (!start) start = constraint.len === prev.constraint.len;
                    else        found = {constraint, value:'len'};
                }
                if (found) return found;
            }
            return false;
        },

        addConstraint() {
            if (!this.build.firstnode) { // first invocation
                if (!!editor.curElm && editor.curElm.hasOwnProperty('m')) { // node clicked
                    this.build.firstnode = editor.curElm;
                    this.instruct.innerHTML = 'Select second node; [ESC] to cancel'
                } else { // no node clicked
                    return; // next clickevent invokes function again
                };
            } else { // second invocation
                if (!!editor.curElm && editor.curElm.hasOwnProperty('m')) { // node clicked

                    if (editor.curElm.id === this.build.firstnode.id) {  // handle invalid selection of identical node as start and end of constraint
                        app.instruct.classList.add('blink');
                        setTimeout(() => { app.instruct.classList.remove('blink'); }, 1400);
                        return;
                    };

                    // build template
                    let tmplen = false;
                    let tmpori = false;
                    switch (this.build.mode) {
                        case 'free': break; // no need to set smth
                        case 'tran': tmpori = { type: 'const' }; break;
                        case 'rot': tmplen = { type: 'const' }; break;
                        // case 'drive': tmpori = {type:'drive'}; tmplen = {type:'drive'}; break; // todo: somehow flag for forced editing or make add drive function to add drives to constraints
                        default: console.log('something went wrong while adding constraint...'); break;
                    }

                    let constraint = {
                        id: this.getNewChar('constraint'),
                        p1: this.build.firstnode.id,
                        p2: editor.curElm.id,
                    };

                    if (tmplen) constraint.len = tmplen;
                    if (tmpori) constraint.ori = tmpori;

                    this.model.addConstraint(mec.constraint.extend(constraint));

                    constraint.init(this.model);
                    this.updateg(); // update graphics
                } else { // no node clicked
                    return; // next clickevent invokes function again
                };

                if (!this.build.continue) {
                    this.resetApp();
                } else {
                    delete this.build.firstnode;
                    app.instruct.innerHTML = 'Select first node; [ESC] to cancel';
                };
            };
        },

        getNewChar(x = 'node') { // returns @type {string} todo: bug: adding a constraint with no constraints in model returns id "constraint" and not "a", which it should
            let charArr = [];
            let name, obj, maxChar, char;

            if ((x === 'node' && this.model.nodes.length > 0) || (x === 'constraint' && this.model.constraints.length > 0)) {
                x === 'node' ? (obj = this.model.nodes, name = 'node', maxChar = 90) : (obj = this.model.constraints, name = 'constraint', maxChar = 122); // 90 = Z, 122 = z
                for (let i = 0; i < obj.length; i++) {
                    charArr.push(obj[i].id.charCodeAt(0)) // push charcodes from first letter of node ids
                }
                charArr.sort(function (a, b) { // sort array containing charcodes
                    return a - b;
                });
                let potChar = charArr[charArr.length - 1] + 1
                char = (potChar <= maxChar) ? String.fromCharCode(potChar) : `${name}${obj.length + 1}`;   // choose one higher than highest charCode or assign numbers when running out of characters
            } else {
                char = x === 'node' ? 'A' : 'a'; // 65 = A, 97 = a,
            };

            return char;
        },

        // build() { // rename if needed again
        //     this.model = mec.model.extend(this.model);
        //     this.model.init().draw(this.g);
        //     this.notify('render');
        // },

        addDrive(elm) { // todo: can check type of passed object.. if it's a node, let choose second node and add a driven rot (most common) constraint 
            if (!(elm === undefined) && ['free', 'tran', 'rot'].includes(elm.type)) {
                if(elm.ori.type === 'free')
                    elm.ori.type = 'drive';
                if(elm.len.type === 'free')
                    elm.len.type = 'drive';
            
                elm.init(this.model);

                this.updateg(); // update graphics
                this.resetApp(); // reset state and instructions
            } else if (elm === undefined) {
                return;
            } else {
                this.instruct.innerHTML = "Can't add a drive to this element. Select a different one or press [ESC&gt to cancel.";
                setTimeout ( () => {app.instruct.innerHTML = 'Select a constraint to add a drive to; [ESC] to cancel'}, 2400 );
            }
        },

        addSupportShape() {
            if (!!editor.curElm && editor.curElm.hasOwnProperty('m')) { // node clicked

                let shape = {
                    type: this.build.mode,
                    p: editor.curElm.id
                };

                this.model.addShape(mec.shape.extend(shape));
                shape.init(this.model);

                this.updateg(); // update graphics
            } else {
                return;
            }
            document.body.style.cursor = 'default';
            this.resetApp();
        },

        addForce() {
            if (!!editor.curElm && editor.curElm.hasOwnProperty('m')) { // node clicked
                let i = 0;
                    this.model.loads.forEach(load => {
                        if (load.type === 'force')
                            i++
                    });
                    i+=1; // number of forces found +1

                let force = {
                    type: this.build.mode,
                    id: `F${i}`,
                    p: editor.curElm.id
                };

                this.model.addLoad(mec.load.extend(force));
                force.init(this.model);

                this.updateg(); // update graphics
            } else {
                return;
            }
            document.body.style.cursor = 'default';
            this.resetApp();
        },

        addSpring() {
            if (!this.build.firstnode) { // first invocation
                if (!!editor.curElm && editor.curElm.hasOwnProperty('m')) { // node clicked
                    this.build.firstnode = editor.curElm;
                    this.instruct.innerHTML = 'Select second node; [ESC] to cancel'
                } else { // no node clicked
                    return; // next clickevent invokes function again
                };
            } else { // second invocation
                if (!!editor.curElm && editor.curElm.hasOwnProperty('m')) { // node clicked
                    let i = 0;
                    this.model.loads.forEach(load => {
                        if (load.type === 'spring')
                            i++
                    });
                    i+=1; // number of springs found +1

                    let spring = {
                        type: this.build.mode,
                        id: `S${i}`,
                        p1: this.build.firstnode.id,
                        p2: editor.curElm.id,
                    };

                    this.model.addLoad(mec.load.extend(spring));

                    spring.init(this.model);
                    this.updateg(); // update graphics
                } else { // no node clicked
                    return; // next clickevent invokes function again
                };
                this.resetApp();
            };
        },

        initViewModal() {
            if (!this.tempElm)
                this.tempElm = {new:{id:'',type:'trace'}}; // default
            viewModal.setContent(ctxm.viewModal());
            document.getElementById('view-fill-color-btn').style.backgroundColor = 'transparent';
            viewModal.show();
        },

        closeViewModal() {
            this.tempElm = false;
        },

        addViewFromModal() {
            if (this.tempElm.new.id.length === 0) // no id defined
                this.tempElm.new.id = `view${this.model.views.length + 1}`;
            this.model.addView(mec.view.extend(this.tempElm.new));
            this.tempElm.new.init(this.model);
            if (['trace','vector'].includes(this.tempElm.new.type))
                this.updateg();
            this.resetApp();
            viewModal.hide()
        },

        // addTrace() {
        //     let trace = {
        //         id:`trace${app.tempElm.old.id}`,
        //         type:'trace',
        //         p:app.tempElm.old.id,
        //         Dt:2, 
        //         stroke:'red' 
        //     };
        //     this.model.addView(mec.view.extend(trace));
        //     trace.init(this.model);
        //     this.updateg(); // update graphics
        // },

        // removeTrace() {
        //     let traces = [];
        //     this.model.dependentsOf(this.model.nodeById(app.tempElm.old.id)).views.forEach(el=>{
        //         if (el.type === 'trace' && el.p.id === app.tempElm.old.id) {
        //             traces.push(el.id);
        //         }
        //     })
        //     this.model.removeView(this.model.viewById(traces[0]));
        //     this.updateg(); // update graphics
        // },

        initCtxm(elm) { // todo: remember to add option for drive func
            console.log(elm.type)

            this.tempElm = {};  // save elm for eventlistener & state-check
            // this.tempElm.type = (!!elm.type && ['free', 'rot', 'tran', 'ctrl'].includes(elm.type)) ? 'constraint' : 'node'; // checked elm type when node had no type
            this.tempElm.type = ['free', 'rot', 'tran', 'ctrl'].includes(elm.type) ? 'constraint' : elm.type; // check elm type
            this.tempElm.old = JSON.parse(elm.asJSON());
            this.tempElm.new = JSON.parse(elm.asJSON());
            if (!this.tempElm.new.ori)  // needs to exist because of minimal form of asJSON()
                this.tempElm.new.ori = {type:'free'};
            if (!this.tempElm.new.len) 
                this.tempElm.new.len = {type:'free'};
            
            // save label-state for resetting to it when closing ctxm
            this.tempElm.labelState = {nodes: this.model.graphics.labels.nodes, constraints: this.model.graphics.labels.constraints, loads: this.model.graphics.labels.loads};
            // show labels that are hidden
            if (!this.model.graphics.labels.nodes) this.model.graphics.labels.nodes = true;
            if (!this.model.graphics.labels.constraints) this.model.graphics.labels.constraints = true;
            if (!this.model.graphics.labels.loads) this.model.graphics.labels.loads = true;
            // render labels
            app.notify('render');

            // app.tempElm.old = JSON.parse(JSON.stringify(elm));
            this.updateCtxm(this.tempElm.old, this.tempElm.type);
            this.showCtxm();
        },

        showCtxm() {
            this.ctxmenu.style.display = 'block'
            this.ctxmenu.style.left = `${this.evt.clientX}px`;
            this.ctxmenu.style.top = `${this.evt.clientY}px`;
        },

        hideCtxm(skip = false) {
            this.ctxmenu.style.display = 'none';

            if (!!this.tempElm.new && this.tempElm.type === 'constraint' && !skip)
                this.replaceConstraint(this.tempElm.old, this.tempElm.new);
                // this.tempElm.type === 'constraint' ? this.replaceConstraint(this.tempElm.old, this.tempElm.new) : this.replaceNode(this.tempElm.old, this.tempElm.new);

            // this.tempElm.labelState = {nodes: this.model.graphics.labels.nodes, constraints: this.model.graphics.labels.constraints, loads: this.model.graphics.labels.loads};
            // show labels that are hidden
            if (this.tempElm.labelState.nodes !== this.model.graphics.labels.nodes) this.model.graphics.labels.nodes = this.tempElm.labelState.nodes;
            if (this.tempElm.labelState.constraints !== this.model.graphics.labels.constraints) this.model.graphics.labels.constraints = this.tempElm.labelState.constraints;
            if (this.tempElm.labelState.loads !== this.model.graphics.labels.loads) this.model.graphics.labels.loads = this.tempElm.labelState.loads;

            // reset app edit-state
            this.tempElm = false;
        },

        updateCtxm(elm, type) {
            console.log(elm);

            // delete old bodyelements of the ctxm to append updated ones
            while (this.ctxmenubody.hasChildNodes()) {
                this.ctxmenubody.removeChild(this.ctxmenubody.lastChild);
            };

            // template ctxmenu

            //replace header
            this.ctxmenuheader.innerHTML = ctxm.header(elm, type);

            //append new body
            if (type === 'constraint') { // constraints
                this.ctxmenubody.innerHTML += ctxm.sectionTitle('orientation');
                this.ctxmenubody.innerHTML += ctxm.oriType(elm);

                if (!!elm.ori && elm.ori.type === 'drive') {

                    if (!this.tempElm.new.ori.hasOwnProperty('Dt')) // make sure the JSON represantation has the optional properties
                        this.tempElm.new.ori.Dt = 1;
                    this.ctxmenubody.innerHTML += ctxm.Dt(elm, 'ori');

                    if (!this.tempElm.new.ori.hasOwnProperty('Dw'))
                        this.tempElm.new.ori.Dw = 2*pi;
                    this.ctxmenubody.innerHTML += ctxm.Dw(elm, 'ori');
                };

                if (!!elm.ori && elm.ori.type === 'ref') {
                    const oriRefId = !!elm.ori.ref ? elm.ori.ref : app.model.constraints[0].id;
                    this.ctxmenubody.innerHTML += ctxm.ref(elm, 'ori', oriRefId);
                };

                this.ctxmenubody.innerHTML += ctxm.sectionTitle('lenght');
                this.ctxmenubody.innerHTML += ctxm.lenType(elm);

                if (!!elm.len && elm.len.type === 'drive') {

                    if (!this.tempElm.new.len.hasOwnProperty('Dt'))
                        this.tempElm.new.len.Dt = 1;
                    this.ctxmenubody.innerHTML += ctxm.Dt(elm, 'len');

                    if (!this.tempElm.new.len.hasOwnProperty('Dr'))
                        this.tempElm.new.len.Dr = 100;
                    this.ctxmenubody.innerHTML += ctxm.Dr(elm, 'len');
                };

                if (!!elm.len && elm.len.type === 'ref') {
                    const lenRefId = !!elm.len.ref ? elm.len.ref : app.model.constraints[0].id
                    this.ctxmenubody.innerHTML += ctxm.ref(elm, 'len', lenRefId);
                };

                this.ctxmenubody.innerHTML += ctxm.sectionTitle('nodes');
                this.ctxmenubody.innerHTML += ctxm.nodes(elm);
                this.ctxmenubody.innerHTML += ctxm.removeConstraintButton();
            };
            if (type === 'node') { // nodes
                this.ctxmenubody.innerHTML += ctxm.nodeCoordinates(elm);
                // let traced = false;
                // this.model.dependentsOf(this.model.nodeById(elm.id)).views.forEach(el=>{
                //     if (!traced && el.type === 'trace') {
                //         traced = true;
                //     }
                // })
                // this.ctxmenubody.innerHTML += ctxm.nodeBase(elm,traced);
                this.ctxmenubody.innerHTML += ctxm.nodeBase(elm);
            };
            if (type === 'force') { // forces
                this.ctxmenubody.innerHTML += ctxm.forceValue(elm);
                this.ctxmenubody.innerHTML += ctxm.forceMode(elm);
                this.ctxmenubody.innerHTML += ctxm.forceNode(elm);
            };
            if (type === 'spring') { // springs
                // this.ctxmenubody.innerHTML += ctxm.springProps(elm);
                this.ctxmenubody.innerHTML += ctxm.springNodes(elm);
                this.ctxmenubody.innerHTML += ctxm.springLen(elm);
                this.ctxmenubody.innerHTML += ctxm.springK(elm);
                // this.ctxmenubody.innerHTML += ctxm.removeSpringButton();
                // this.ctxmenubody.innerHTML += ctxm.springL0(elm);
            };
            
        },

        loadFromJSON(files) {
            let file = files[0]
            let fr = new FileReader();
            let model;

            fr.onload = (() => { // async
                return (e) => {
                    model = JSON.parse(e.target.result);
                    this.newModel(model);
                    this.importConfirmed = false; // reset
                }
            })(file);
            fr.readAsText(file);
        },

        saveToJSON() {
            let a = document.createElement('a');
            // let file = new Blob([JSON.stringify(this.model)], { type: 'application/json' }); // model now has toJSON (constraints not fully implemented) which gets automazically invoked by stringify
            let file = new Blob([this.model.asJSON()], { type: 'application/json' });
            a.href = URL.createObjectURL(file);
            a.download = (!!this.model.id && this.model.id.length > 0) ? `${this.model.id}.json` : 'linkage.json';
            document.body.appendChild(a); // Firefox needs the element to be added to the DOM for this to work, Chrome & Edge ¯\_(ツ)_/¯
            a.click();
            document.body.removeChild(a);
        },

        newModel(model = {}) {
            if (typeof this.model === 'object' && !this.importConfirmed) {
                if (!confirm('All unsaved changes will be lost! Continue?'))
                    return;
            };

            // delete old range-inputs
            while (actcontainer.hasChildNodes()) {
                actcontainer.removeChild(actcontainer.lastChild);
            };

            delete this.model;  // not necessary but better safe than sorry
            this.model = model;

            this.init();
            this.updateg();
        },

        updateTempElmNew(key, value) { // this seems to be a problem from appevents.js since tempElm is sometimes falsely undefined ...
            this.tempElm.new[key] = value;
        },

        toggleViewfill() { // state of button [fill] in viewModal when setting type 'trace'
            let fill = document.getElementById('view-fill-color');
            let fillBtn = document.getElementById('view-fill-color-btn');

            fill.disabled = !fill.disabled;
            fillBtn.style.backgroundColor = fill.disabled ? 'transparent' : '#e9ecef';

            if (fill.disabled && this.tempElm.new.hasOwnProperty('fill')) {
                delete this.tempElm.new.fill;
            } else if (!fill.disabled && !this.tempElm.new.hasOwnProperty('fill')) {
                this.tempElm.new.fill = '#009900'
            };
        }
    }, mixin.observable,      // for handling (custom) events ..
       mixin.pointerEventHdl, // managing (delegated) pointer events
       mixin.tickTimer,       // synchronize pointer events and rendering
       mixin.zoomPan)
};

let app;

// initialize bootstrap modals
let modelModal = new Modal(document.getElementById('modelModal'), {
    backdrop: 'static',
    keyboard: true // dismiss with ESC key
});

let viewModal = new Modal(document.getElementById('viewModal'), {
    backdrop: 'static'
    // content: `<div class="modal-header bg-dark text-white">
    //               <h5 class="modal-title">add view component</h5>
    //               <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
    //           </div>
    //           <div class="modal-body">
    //               ${ctxm.view()}
    //           </div>
    //           <div class="modal-footer">
    //               <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
    //               <button type="button" class="btn btn-primary" id="modalAccept">Apply</button>
    //           </div>`
});



let jsonEditor = CodeMirror.fromTextArea(document.getElementById('modalTextarea'), {
    mode: 'javascript',
    theme: 'lucario',   // dark: dracula, lucario   light: default, mdn-like
    lineNumbers: true,
    styleActiveLine: true,
    matchBrackets: true,
    viewportMargin: Infinity,
    lineWrapping: true
  });

  let inc;

//   jsonEditor.on('change', function (editor) {
//     app.tempElm = jsonEditor.getValue();
//   });

window.onload = () => {
    let c = document.getElementById('canvas'),
        main = document.getElementById('main'); 

    // create App instance
    (app = App.create()).init();
    app.toggleDarkmode(); // switch on, off by default
    // fill graphics queue
    app.updateg();

    // fit canvas
    c.width = main.clientWidth;
    c.height = main.clientHeight - 30;

    // fit inputs
    let rangewidth = (c.width - 350)/2;
    for (const drive in app.model.drives) {
        document.getElementById(app.model.drives[drive].id).slider.style.width = `${rangewidth}px`
    }

    // render graphics
    app.notify('render');

    // define non-editor events
    events.navbarClick('navcollapse');
    events.navbarChange('import');
    events.sidebarClick('sb-l');
    events.keyboardDown(); // binds to document
    // events.preventDefaultCTXM(); // binds to document
    events.ctxmClick('contextMenu');
    events.ctxmInput('contextMenu');
    events.ctxmChange('contextMenu');
    events.resize(); // binds to window
    events.modalShown('modelModal');
    events.modalAccept('modalAccept');
    events.viewModalChange('viewModal');
    events.viewModalClick('viewModal');
    events.viewModalHide('viewModal');

    // make cxtm dragable (decalre private, no need to access later)
    new Draggabilly(document.getElementById('contextMenu'), {
        containment: '.main-container',
        handle: '.card-header'
    });

    // no need to access later, can be static
    new Modal(document.getElementById('aboutModal'), {
        keyboard: true, // dismiss with ESC key
        content: `<div class="modal-header bg-dark text-white">
        <h5 class="modal-title">About <i>mecEdit</i></h5>
        <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
        </div>
        <div class="modal-body text-center">
        Version ${app.VERSION}<br>
        <a href="https://github.com/jauhl/mecEdit">mecEdit on Github<a/><br><br>
        &#169; 2018 Jan Uhlig [jan.uhlig@web.de]
        </div>`
    });

    // dispatch 'resize' event to fix the initial sizing bug on laptops
    // window.dispatchEvent(new Event('resize')); // shouldn't be a new Event
    window.resizeBy(0,0);
};