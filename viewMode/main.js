let app, canvas;
const apiLoader = new PIXI.Loader(), dropLoader = new PIXI.Loader(), cont = new PIXI.Container();
const SML0 = "sml_cloth0", SML1 = "sml_cloth1", BIG0 = "big_cloth0", BIG1 = "big_cloth1";
let currentSpine = null;
let idolInfo, idolID, idolName;
let dressTypes = new Array(), dressMap = new Map(),
    dressInfo, dressType;
let currentUUID = "";
let pathJSON, pathAtlas, pathTexture;

function DropHandler(event) {
    event.preventDefault();
    if (event.dataTransfer.items) {
        for (let item of event.dataTransfer.items) {
            if (item.kind === "file") {
                const file = item.getAsFile();
                const blobURL = window.URL.createObjectURL(file);
                if (file.name.endsWith(".atlas")) {
                    pathAtlas = blobURL;
                } else if (file.name.endsWith(".png") || file.name.endsWith(".webp")) {
                    pathTexture = file;
                } else if (file.name.endsWith(".json")) {
                    pathJSON = blobURL;
                }
            }
        }
    } else {
        for (let file of event.dataTransfer.files) {
            const blobURL = window.URL.createObjectURL(file);
            if (file.name.endsWith(".atlas")) {
                pathAtlas = blobURL;
            } else if (file.name.endsWith(".png") || file.name.endsWith(".webp")) {
                pathTexture = file;
            } else if (file.name.endsWith(".json")) {
                pathJSON = blobURL;
            }
        }
    }

    if (pathAtlas && pathTexture && pathJSON) {
        dropLoader
            .add("dropJson", pathJSON)
            .add("dropAtlas", pathAtlas)
            .load(renderByDrop);
    }
    else {
        alert("missing files!");
    }
}

function DragOverHandler(event) {
    event.preventDefault();
    dropLoader.reset();
}

function Init() {
    canvas = document.getElementById("canvas");

    app = new PIXI.Application({
        width: canvas.clientWidth,
        height: canvas.clientHeight,
        view: canvas
    });
    app.stage.addChild(cont);

    apiLoader
        .add("IdolList", "https://api.shinycolors.moe/spines/IdolList")
        .add("UpdateLog", "https://api.shinycolors.moe/spines/UpdateLog")
        .load(onJsonLoaded);

    const colorPicker = document.getElementById("colorPicker");
    colorPicker.onchange = (event) => {
        app.renderer.backgroundColor = String(event.target.value).replace(/#/, '0X');
    };

}

function SetupUpdateLog(updateLog) {
    let modal = document.getElementById("divModalBody");

    updateLog.forEach(element => {
        let divTitle = document.createElement("div");
        divTitle.classList.add("p-1");
        let divContent = document.createElement("p");
        divContent.classList.add("p-3");

        element.Content.forEach(e => {
            let span = document.createElement("span");
            span.textContent = e;
            span.classList.add("text-info");
            divContent.appendChild(span);
            divContent.appendChild(document.createElement("br"));
        });

        modal.appendChild(divTitle.appendChild(document.createTextNode(element.Date)));
        modal.appendChild(divContent);
    });
    document.getElementById('showLog').click();
}

function SetupIdolList() {
    const idolList = document.getElementById("idolList");

    idolList.innerHTML = "";

    idolInfo.forEach((element, index) => {
        const option = document.createElement("option");
        option.textContent = element.IdolName;
        option.value = element.IdolID;
        if (index == 1) option.selected = true;
        idolList.appendChild(option);
    });
    idolID = 1;
    idolName = idolInfo[idolID].Directory;
    idolList.onchange = () => {
        idolID = idolList.value;
        idolName = idolInfo[idolID].Directory;
        testAndLoadDress();
    };

    testAndLoadDress();
}

function testAndLoadDress() {
    if (!apiLoader.resources[idolName]) {
        apiLoader.add(idolName, `https://api.shinycolors.moe/spines/dressList/${idolID}`).load(SetupDressList);
    }
    else {
        SetupDressList();
    }
}

function SetupDressList() {
    const dressList = document.getElementById("dressList");
    dressList.innerHTML = "";

    dressTypes = new Array();
    dressMap.clear();

    if (!apiLoader.resources[idolName].data) return;

    dressInfo = JSON.parse(apiLoader.resources[idolName].data);
    let flag = false;

    dressInfo.forEach((element, index) => {
        if (element.Exist && !flag) {
            flag = true;
            dressID = index;
        }
        const option = document.createElement("option");
        option.textContent = element.DressName;
        option.value = index;
        if (!element.Exist) option.disabled = true;
        if (index == dressID) option.selected = true;
        if (!dressMap.has(element.DressType)) {
            dressMap.set(element.DressType, new Array());
            dressTypes.push(element.DressType);
        }
        dressMap.get(element.DressType).push(option);
    });

    dressTypes.forEach(element => {
        const optGroup = document.createElement("optgroup");
        optGroup.label = element;
        dressMap.get(element).forEach(e => {
            optGroup.appendChild(e);
        });
        dressList.appendChild(optGroup);
    });

    dressList.onchange = () => {
        dressID = dressList.value;
        SetupTypeList();
    };

    SetupTypeList();
}

function SetupTypeList() {
    if (!dressInfo) return;
    const typeList = document.getElementById("typeList");

    typeList.innerHTML = "";

    let big0, big1, sml0, sml1;
    let flag_sml0 = false, flag_big0 = false,
        flag_sml1 = false, flag_big1 = false;
    if (dressInfo[dressID].Sml_Cloth0) {
        flag_sml0 = true;
        sml0 = document.createElement("option");
        sml0.textContent = "Q版_通常服";
        sml0.value = SML0;
        typeList.appendChild(sml0);
    }
    if (dressInfo[dressID].Sml_Cloth1) {
        flag_sml0 = true;
        sml1 = document.createElement("option");
        sml1.textContent = "Q版_演出服";
        sml1.value = SML1;
        typeList.appendChild(sml1);
    }
    if (dressInfo[dressID].Big_Cloth0) {
        flag_big0 = true;
        big0 = document.createElement("option");
        big0.textContent = "一般_通常服";
        big0.value = BIG0;
        typeList.appendChild(big0);
    }
    if (dressInfo[dressID].Big_Cloth1) {
        flag_big1 = true;
        big1 = document.createElement("option");
        big1.textContent = "一般_演出服";
        big1.value = BIG1;
        typeList.appendChild(big1);
    }

    if (flag_big0) {
        dressType = BIG0;
        big0.selected = true;
    }
    else if (flag_big1) {
        dressType = BIG1;
        big1.selected = true;
    }
    else if (flag_sml0) {
        dressType = SML0;
        sml0.selected = true;
    }
    else if (flag_sml1) {
        dressType = SML1;
        sml1.selected = true;
    }

    typeList.onchange = () => {
        dressType = typeList.value;
        testAndLoadAnimation();
    };

    testAndLoadAnimation();
}

function testAndLoadAnimation() {
    currentUUID = dressInfo[dressID].DressUUID;
    if (!app.loader.resources[`${currentUUID}/${dressType}`]) {
        app.loader.add(`${currentUUID}/${dressType}`, `https://static.shinycolors.moe/spines/${idolName}/${currentUUID}/${dressType}/data.json`).load(SetupAnimationList);
    }
    else {
        SetupAnimationList();
    }
}

function SetupAnimationList() {
    const animationList = document.getElementById("animationList");
    currentSpine = new PIXI.spine.Spine(app.loader.resources[`${currentUUID}/${dressType}`].spineData);

    animationList.innerHTML = "";
    const animationName = "wait"

    for (let animation of currentSpine.stateData.skeletonData.animations) {
        const name = animation.name;
        const option = document.createElement("option");
        option.textContent = name;
        option.value = name;
        option.selected = name === "wait";
        animationList.appendChild(option);
    }

    animationList.onchange = () => {
        const animationName = animationList.value;

        renderToStage(animationName);
    };

    renderToStage(animationName);
}

async function renderByDrop() {
    const rawJson = JSON.parse(dropLoader.resources.dropJson.data);
    const rawAtlas = dropLoader.resources.dropAtlas.data;
    const rawTexture = await blobToBase64(pathTexture);
    const spineAtlas = new PIXI.spine.core.TextureAtlas(rawAtlas, (line, callback) => {
        callback(PIXI.BaseTexture.from(rawTexture));
    });
    const spineAtlasLoader = new PIXI.spine.core.AtlasAttachmentLoader(spineAtlas);
    const spineJsonParser = new PIXI.spine.core.SkeletonJson(spineAtlasLoader);
    const spineData = spineJsonParser.readSkeletonData(rawJson);
    currentSpine = new PIXI.spine.Spine(spineData);
    renderToStage("wait");
}

function blobToBase64(blob) {
    return new Promise((resolve, _) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

function renderToStage(aName) {
    try {
        currentSpine.skeleton.setSkinByName('normal');
    } catch (e) {
        currentSpine.skeleton.setSkinByName('default');
    }
    currentSpine.skeleton.setToSetupPose();
    currentSpine.update(0);
    currentSpine.autoUpdate = true;

    cont.removeChild(cont.children[0]);

    cont.addChild(currentSpine);

    const localRect = currentSpine.getLocalBounds();
    currentSpine.position.set(-localRect.x, -localRect.y);

    let scale = 1;
    switch (dressType) {
        case SML0:
            break;
        case SML1:
            scale = 2.5;
            break;
        case BIG0:
        case BIG1:
            scale = Math.min(
                app.view.width / currentSpine.spineData.width,
                app.view.height / currentSpine.spineData.height
            ) * 0.85
            if (scale < 0.8) scale = 0.8;
            break;
    }

    cont.scale.set(scale);
    cont.position.set(
        (app.screen.width - cont.width) * 0.5,
        (app.screen.height - cont.height) * 0.5
    );

    try {
        currentSpine.state.setAnimation(0, aName, true);
    } catch (e) {
        currentSpine.state.setAnimation(0, currentSpine.spineData.animations[0].name, true);
    }
}

function onJsonLoaded(loader, resources) {
    idolInfo = JSON.parse(resources.IdolList.data)
    SetupUpdateLog(JSON.parse(resources.UpdateLog.data));
    SetupIdolList();
}