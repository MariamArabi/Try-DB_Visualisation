var svg = d3.select("svg"),
    margin = { top: 20, right: 20, bottom: 30, left: 40 },
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var colors = d3.scaleOrdinal()
    .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

var fader = function(color) { return d3.interpolateRgb(color, "#fff")(0.2); },
    color = d3.scaleOrdinal(d3.schemeCategory20.map(fader)),
    format = d3.format(",d");

d3.csv("bdd/nutriments.csv", function (error, data) {
    if (error) throw error;

    data.forEach(element => {
        element.AvK = +element.AvK;
        element.AvN = +element.AvN;
        element.AvP = +element.AvP;
        element.AvMoisture = +element.AvMoisture;
    });

    console.log(data);

    var stratified = d3.stratify()
        .id(function(d) { return d.name; })
        .parentId(function(d) { return d.parent; })
        (data);

    var root = stratified
        .sum(function(d) { return d.AvK; })
        .sort(function(a, b) { return b.AvK - a.AvK; });

    var treemap = d3.treemap()
        .tile(d3.treemapResquarify)
        .size([width / 2, height])
        .round(true)
        .paddingInner(1);

    treemap(root);

    var cell = svg.selectAll("g")
        .data(root.leaves())
        .enter()
        .append("g")
        .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

    cell.append("rect")
        .attr("id", function(d) { return d.data.id; })
        .attr("width", function(d) { return d.x1 - d.x0; })
        .attr("height", function(d) { return d.y1 - d.y0; })
        .attr("fill", function(d) { 
            return color(d.parent.id); 
        });

    cell.append("clipPath")
        .attr("id", function(d) { return "clip-" + d.data.id; })
        .append("use")
        .attr("xlink:href", function(d) { return "#" + d.data.id; });

    cell.append("text")
        .attr("clip-path", function(d) { return "url(#clip-" + d.data.id + ")"; })
        .selectAll("tspan")
        .data(function(d) { return d.data.name; })
        .enter()
        .append("tspan")
        .attr("x", 4)
        .attr("y", function(d, i) { return 13 + i * 10; })
        .text(function(d) { 
            return d; 
        });

    cell.append("title")
        .text(function(d) { 
            return d.id; 
        });
});
