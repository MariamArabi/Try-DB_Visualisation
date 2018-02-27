var MAX_SELECTED_PLANTS = 10;
var keys = ["AvMoisture", "AvN", "AvP", "AvK"];

var svgA = d3.select(".a svg");
var svgC = d3.select(".c svg");
var margin = { top: 20, right: 20, bottom: 30, left: 40 };
var width = +svgC.attr("width") - margin.left - margin.right;
var height = +svgC.attr("height") - margin.top - margin.bottom;

//Variables Dan
g = svgC.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var x = d3.scaleBand()
    .rangeRound([0, width])
    .paddingInner(0.05)
    .align(0.1);

var y = d3.scaleLinear()
    .rangeRound([height, 0]);

var colors = d3.scaleOrdinal()
    .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

//Fin variables Dan

var fader = function(color) { return d3.interpolateRgb(color, "#fff")(0.2); },
    color = d3.scaleOrdinal(d3.schemeSet3.map(fader)),
    format = d3.format(",d");

var treemap = d3.treemap()
    .tile(d3.treemapResquarify)
    .size([+svgA.attr("width"), +svgA.attr("height")])
    .round(true)
    .paddingInner(1);

var tooltip = d3.select('body')
    .append('div')
    .attr('class', 'hidden tooltip');

var selectedPlants = [];

d3.dsv(",", "data/nutriments_petit.csv", function (data) {
    data.AvK = +data.AvK;
    data.AvN = +data.AvN;
    data.AvP = +data.AvP;
    data.AvMoisture = +data.AvMoisture;
    data.total = data.AvK + data.AvN + data.AvP + data.AvMoisture;

    return data;

}).then(function(data) {
    for (i of data) {
        if (i.ScientificName) {
            selectedPlants.push(i);
        }
    }

	initButtons(data);
	displayTreemap(data, "AvK");
    displayBarChart(selectedPlants);
});

function updatePlants() {

    selectedPlants.sort(function(a, b) { return b.total - a.total; });

    svgC.selectAll("rect").data(d3.stack().keys(keys)(selectedPlants)).exit().remove();

    var t = d3.transition()
        .duration(500)

    x.domain(selectedPlants.map(function(d) { return d.Name; }));
    y.domain([0, d3.max(selectedPlants, function(d) { return d.total; })]).nice();
    svg.select(".x")
        .transition(t)
        .call(xAxisCall)

    g.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(y).ticks(null, "s"))
    .append("text")
      .attr("x", 2)
      .attr("y", y(y.ticks().pop()) + 0.5)
      .attr("dy", "0.32em")
      .attr("fill", "#000")
      .attr("font-weight", "bold")
      .attr("text-anchor", "start")
      .text("Composition");

    g.append("g")
    .selectAll("g")
    .data(d3.stack().keys(keys)(selectedPlants))
    .enter().append("g")
        .attr("fill", function(d) { return colors(d.key); })
    .selectAll("rect")
    .data(function(d) { return d; })
    .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.data.Name);})
        .attr("y", function(d) { return y(d[1]); })
        .attr("height", function(d) { return y(d[0]) - y(d[1]); })
        .attr("width", x.bandwidth());
}

function displayBarChart(data) {
    displayGraph(selectedPlants);

    data.sort(function(a, b) { return b.total - a.total; });

    g.append("g")
        .selectAll("g")
    .data(d3.stack().keys(keys)(data))
        .enter().append("g")
        .attr("fill", function(d) { return colors(d.key); })
        .selectAll("rect")
    .data(function(d) { return d; })
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.data.Name);})
        .attr("y", function(d) { return y(d[1]); })
        .attr("height", function(d) { return y(d[0]) - y(d[1]); })
        .attr("width", x.bandwidth());
}

function displayGraph (data) {
    data.sort(function(a, b) { return b.total - a.total; });
    x.domain(data.map(function(d) { return d.Name; }));
    y.domain([0, d3.max(data, function(d) { return d.total; })]).nice();
    colors.domain(keys);

    /*------------       Axe horizontal       ------------*/
    g.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    /*------------       Axe vertical       ------------*/
    g.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(y).ticks(null, "s"))
    .append("text")
      .attr("x", 2)
      .attr("y", y(y.ticks().pop()) + 0.5)
      .attr("dy", "0.32em")
      .attr("fill", "#000")
      .attr("font-weight", "bold")
      .attr("text-anchor", "start")
      .text("Composition");

      /*------------       Légende       ------------*/

    var legend = g.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "end")
    .selectAll("g")
    .data(keys.slice().reverse())
    .enter().append("g")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
      .attr("x", width - 19)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", colors)

    legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .text(function(d) { return d; });
}

function selectPlant(plant) {

    if (selectedPlants.includes(plant)) {
        index = selectedPlants.indexOf(plant);
        selectedPlants.splice(index, 1);
    } else if (selectedPlants.length < MAX_SELECTED_PLANTS) {
        selectedPlants.push(plant);
    } else {
        alert("Can't select more than " + MAX_SELECTED_PLANTS + " plants")
    }

    svgA.selectAll("rect")
        .filter(function (d) {
            return selectedPlants.includes(d.data);
        })
        .attr("fill", "red");

	svgA.selectAll("rect")
        .filter(function (d) {
            return !selectedPlants.includes(d.data);
        })
        .attr("fill", function(d) {
            return color(d.parent.id);
        });

    updatePlants();
}

function initButtons(data) {
    d3.select(".b")
    .append("button")
    .text("Average P")
    .on("click", function() {
        updateTreemap(data, "AvP");
    });

    d3.select(".b")
    .append("button")
    .text("Average K")
    .on("click", function() {
        updateTreemap(data, "AvK");
    });

    d3.select(".b")
    .append("button")
    .text("Average N")
    .on("click", function() {
        updateTreemap(data, "AvN");
    });

    d3.select(".b")
    .append("button")
    .text("Average Moisture")
    .on("click", function() {
        updateTreemap(data, "AvMoisture");
    });
}

function displayTreemap(data, variable) {

    var stratified = d3.stratify()
        .id(function(d) { return d.Name; })
        .parentId(function(d) { return d.CropCategory; })
        (data);

    var root = stratified
        .sum(function(d) { return d[variable]; })
        .sort(function(a, b) { return b[variable] - a[variable]; });

    treemap(root);

    console.log(root.leaves())

    var cell = svgA.selectAll("g")
        .data(root.leaves())
        .enter()
        .append("g")
        .attr("id", function(d) { return d.id })
        .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

    cell.append("rect")
        .attr("id", function(d) { return d.id; })
        .attr("width", function(d) { return d.x1 - d.x0; })
        .attr("height", function(d) { return d.y1 - d.y0; })
        .attr("fill", function(d) {
            return color(d.parent.id);
        })
        .on("mouseover", function(d) {
            onMouseOver(d);

            d3.select(this)
                .style("opacity", "0.5");
        })
        .on("mouseout", function(d) {
            onMouseOut(d);

            d3.select(this)
                .style("opacity", "1.0");
        })
        .on("click", function(d) {
            selectPlant(d.data);
        });

    /*cell.append("text")
        .text(function(d) { return d.id; })
        .attr("y", function(d) { return 20; })
        .attr("x", function(d) { return 5; });*/
}

function updateTreemap(data, variable) {

    var stratified = d3.stratify()
        .id(function(d) { return d.Name; })
        .parentId(function(d) { return d.CropCategory; })
        (data);

    var root = stratified
        .sum(function(d) { return d[variable]; })
        .sort(function(a, b) { return b[variable] - a[variable]; });

    treemap(root);

    svgA.selectAll("g")
        .data(root.leaves())
        .transition()
        .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

    svgA.selectAll("rect")
        .data(root.leaves())
        .transition()
        .attr("width", function(d) { return d.x1 - d.x0; })
        .attr("height", function(d) { return d.y1 - d.y0; });
}

function onMouseOver(element) {

    var mouse = d3.mouse(svgA.node()).map(function (d) {
        return parseInt(d);
    });

    tooltip.classed('hidden', false)
        .attr('style', 'left:' + (mouse[0] + 15) +
        'px; top:' + (mouse[1] - 35) + 'px')
        .html(element.id);
}

function onMouseOut(element) {
    tooltip.classed('hidden', true);
}
