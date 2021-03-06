/**
 * @author JKetelaar
 */

var map = L.map('map').setView([0, 0], 3);

function Area(bounds) {

    this.startPosition = new Position(bounds.getSouthWest());
    this.endPosition = new Position(bounds.getNorthEast());

    this.draw = function () {

        var startPoint = map.project(bounds.getSouthWest(), map.getMaxZoom());
        var startX = Math.floor(startPoint.x / 30) * 30;
        var startY = (Math.ceil(startPoint.y / 30) * 30) - 15;

        var endPoint = map.project(bounds.getNorthEast(), map.getMaxZoom());
        var endX = Math.ceil(endPoint.x / 30) * 30;
        var endY = (Math.floor(endPoint.y / 30) * 30) - 15;

        var startLatLng = map.unproject(L.point(startX, startY), map.getMaxZoom());
        var endLatLng = map.unproject(L.point(endX, endY), map.getMaxZoom());

        drawnItems.addLayer(L.rectangle(L.latLngBounds(startLatLng, endLatLng), {color: "#33b5e5", weight: 1}));
    };

    this.toSingleString = function () {

        return "Area area = new Area("
            + this.startPosition.x + ", "
            + this.startPosition.y + ", "
            + this.endPosition.x + ", "
            + this.endPosition.y
            + ");"
    };

    this.toString = function (last) {

        var output = "\tnew Area("
            + this.startPosition.x + ", "
            + this.startPosition.y + ", "
            + this.endPosition.x + ", "
            + this.endPosition.y
            + ")";

        if (!last) output += ",";
        output += "\n";

        return output;
    };
}

function Position(latLng) {

    var point = map.project(latLng, map.getMaxZoom());
    this.y = 53504 - point.y;
    this.y = Math.floor(this.y / 30) + 2833;
    this.x = Math.floor(point.x / 30) + 1984;

    this.toSingleString = function () {

        return "Position position = new Position(" + this.x + ", " + this.y + ", 0)";
    };

    this.toString = function (last) {

        var output = "\tnew Tile(" + this.x + ", " + this.y + ", 0)";

        if (!last) output += ",";
        output += "\n";

        return output;
    };
}

var path = [];
var areaList = [];

var output = document.getElementById("output");
output.value = "";

L.tileLayer('assets/images/map/{z}/{x}/{y}.png', {
    minZoom: 3,
    maxZoom: 8,
    attribution: 'Map data',
    noWrap: true,
    tms: true
}).addTo(map);

var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

L.drawLocal.draw.toolbar.buttons.polyline = 'Create a path';
L.drawLocal.draw.handlers.polyline.tooltip.start = 'Select a start position';
L.drawLocal.draw.handlers.polyline.tooltip.cont = 'Select the next position';
L.drawLocal.draw.handlers.polyline.tooltip.end = 'Select last position to end path';

L.drawLocal.draw.toolbar.buttons.rectangle = 'Create an area';
L.drawLocal.draw.handlers.rectangle.tooltip.start = 'Click and drag to create area';

var options = {
    position: 'topleft',
    draw: {
        polyline: {
            shapeOptions: {
                color: '#f357a1',
                weight: 25
            }
        },
        polygon: false,
        circle: false,
        rectangle: {
            shapeOptions: {
                color: '#33b5e5',
                weight: 5,
                fillColor: '#33b5e5'
            }
        },
        marker: false
    }
};

var drawControl = new L.Control.Draw(options);
map.addControl(drawControl);

map.on('draw:created', function (e) {

    var type = e.layerType, layer = e.layer;

    if (type == 'polyline') {

        addPath(e);
        drawnItems.addLayer(e.layer);
    }
    else if (type == 'rectangle') addArea(e);

    output.style.display = "inline";
});

function addArea(e) {

    var area = new Area(e.layer.getBounds());
    area.draw();
    areaList.push(area);
    outputAreas();
}

function outputAreas() {

    output.value = "";
    if (areaList.length == 1) output.value = areaList[0].toSingleString();
    else if (areaList.length > 0) {

        output.value = "Area[] area = {\n";
        for (var i = 0; i < areaList.length; i++) {

            if (i == areaList.length - 1) output.value += areaList[i].toString(true);
            else output.value += areaList[i].toString(false);
        }
        output.value += "};";
    }
}

function addPath(e) {

    var latLngs = e.layer.getLatLngs(); // Get Leaflet latitudes & longitudes for path positions
    path = new Array(latLngs.length); // Create array to store OSBot coordinates for each path position

    for (var i = 0; i < latLngs.length; i++) {

        path[i] = new Position(latLngs[i]); // Convert latitude & longitude to OSBot coordinate & store
    }

    outputPath();
}

function outputPath() {

    output.value = "";
    if (path.length == 1) output.value = path[0].toSingleString();
    else if (path.length > 0) {

        output.value = "Tile[] tiles = {\n";

        for (var i = 0; i < path.length; i++) {

            if (i == path.length - 1) output.value += path[i].toString(true);
            else output.value += path[i].toString(false);
        }

        output.value += "};";
        output.value += "\nTilePath path = new TilePath(tiles);";
    }
}

var cursorX, cursorY;
document.onmousemove = function (e) {
    cursorX = e.clientX;
    cursorY = e.clientY;
};

var prevRect;
var prevPos;

map.on('mousemove', function (e) {

    var osBotPosition = new Position(e.latlng);

    if (prevPos != osBotPosition) {

        prevPos = osBotPosition;

        if (prevRect != null) map.removeLayer(prevRect);

        var coordText = "[" + osBotPosition.x + ", " + osBotPosition.y + "]";
        var toolTip = document.getElementById("tooltip");
        toolTip.innerHTML = coordText;
        toolTip.style.left = cursorX - 40 + "px";
        toolTip.style.top = cursorY - 60 + "px";

        if (map.getZoom() == 8) toolTip.style.top = cursorY - 80 + "px";

        if (toolTip.style.display == "" || toolTip.style.display == "none") toolTip.style.display = "inline";

        var point = map.project(e.latlng, map.getMaxZoom());

        var startX = Math.floor(point.x / 30) * 30;
        var startY = (Math.ceil(point.y / 30) * 30) - 15;
        var endX = Math.ceil(point.x / 30) * 30;
        var endY = (Math.floor(point.y / 30) * 30) - 15;

        var startLatLng = map.unproject(L.point(startX, startY), map.getMaxZoom());
        var endLatLng = map.unproject(L.point(endX, endY), map.getMaxZoom());

        prevRect = L.rectangle(L.latLngBounds(startLatLng, endLatLng), {
            color: "#33b5e5",
            fillColor: "#33b5e5",
            fillOpacity: 1.0,
            weight: 1
        }).addTo(map);
    }
});
