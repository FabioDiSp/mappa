window.addEventListener('load', function () {
            $(document).ready(function () {
                //Check if the current URL contains '#'
                if (document.URL.indexOf("#") == -1) {
                    // Set the URL to whatever it was plus "#".
                    url = document.URL + "#";
                    location = "#";

                    //Reload the page
                    location.reload(true);
                }
            });
        })


var tooltip = d3.select("#infos");
var active = d3.select(null);

var width = document.documentElement.clientWidth;
var height = document.documentElement.clientHeight;

//CSV data
var datiProv = d3.map();
var datiRegionali = d3.map();
//var datiNazionali = [0, 0, 0, 0, 0, 0, 0, 0];
var datiNazionali = new Array(8);
var increaseperc = 0;

let scale = 6;

var color = d3.scaleThreshold()
    .domain([100, 250, 500, 750, 1000, 2000, 5000, 10000])
    .range(d3.schemeReds[9]);

var provColor = d3.scaleThreshold()
    .domain([10, 35, 50, 100, 250, 400, 1000, 3000])
    .range(d3.schemeReds[9]);

function onReady(callback) {
    var intervalId = window.setInterval(function () {
        if (document.getElementsByTagName('body')[0] !== undefined) {
            window.clearInterval(intervalId);
            callback.call(this);
        }
    }, 1000);
}

function setVisible(selector, visible) {
    document.querySelector(selector).style.display = visible ? 'block' : 'none';
}

onReady(function () {
    setVisible('.page', true);
    setVisible('#loading', false);
});

function zoomed() {
    t = d3
        .event
        .transform
        ;
    g
        .attr("transform", "translate(" + [t.x, t.y] + ")scale(" + t.k + ")")
        ;
}

const zoom = d3
    .zoom()
    .scaleExtent([1, 13])
    .translateExtent([[-100, -100], [width + 100, height + 100]])
    .on("zoom", zoomed)
    ;

var svg = d3
    .select('#map')
    .append('svg')
    .attr('class', 'center-container')
    .attr('height', height)
    .attr('width', width)
    .call(zoom);

svg.append('rect')
    .attr('class', 'background center-container')
    .attr('height', height + 100)
    .attr('width', width + 100)
    .on('click', clicked);

var promises = [
    d3.json("https://raw.githubusercontent.com/FabioDiSp/betamap/master/italy.json"),
    d3.csv("https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-province/dpc-covid19-ita-province-latest.csv", function (d) { datiProv.set(d.codice_provincia, d.totale_casi); }),
    d3.csv("https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-regioni/dpc-covid19-ita-regioni-latest.csv", function (d) {
        var x = new Array(9);
        x = [d.terapia_intensiva, //[0]
        d.totale_ospedalizzati, //[1]
        d.totale_positivi, //[2]
        d.nuovi_positivi, //[3]
        d.dimessi_guariti, //[4]
        d.deceduti, //[5]
        d.totale_casi, //[6]
        parseFloat(d.variazione_totale_positivi / d.totale_positivi * 100).toPrecision(2),
        d.data
        ];
        datiRegionali.set(d.codice_regione, x);
        //datiRegionali.set(d.codice_regione, d.totale_attualmente_positivi);
        //console.log(datiRegionali);
    }),
    d3.csv("https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-andamento-nazionale/dpc-covid19-ita-andamento-nazionale-latest.csv", function (d) {
        datiNazionali = [d.terapia_intensiva,
        d.totale_ospedalizzati,
        d.totale_positivi,
        d.nuovi_positivi,
        d.dimessi_guariti,
        d.deceduti,
        d.totale_casi,
        d.data
        ];
        increaseperc = datiNazionali[3] / datiNazionali[2] * 100;
    })
]

Promise.all(promises).then(ready)

var projection;

var isMobile = {
    Android: function () {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function () {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function () {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function () {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function () {
        return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
    },
    any: function () {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    },
    Facebook: function () {
        var ua = navigator.userAgent || navigator.vendor || window.opera;
        return (ua.indexOf("FBAN") > -1) || (ua.indexOf("FBAV") > -1);
    }
};

if (isMobile.any()) {
    projection = d3.geoMercator()
        .center([12.5, 44])
        .scale([width * 4.2])
        .translate([width / 2, height / 2])
        ;
} else if (isMobile.Facebook()) {
    projection = d3.geoMercator()
        .center([12.5, 42])
        .scale([width * 1])
        .translate([width / 2, height / 2])
        ;
} else {
    projection = d3.geoMercator()
        .center([12.5, 42])
        .scale([width * 2])
        .translate([width / 2, height / 2])
        ;
}
/*
var projection = d3.geoMercator()
    .center([12.5, 42])
    .scale([width * 2])
    .translate([width / 2, height / 2])
    ;*/

var path = d3.geoPath()
    .projection(projection);

var g = svg.append("g")
    .attr('class', 'center-container center-items it-state');

function ready([json]) {

    //[0]=terapia intensiva, [1]=ospedalizzati, [2]=tot attualmente positivi
    //[3]=nuovi positivi, [4]=guariti, [5]=deceduti,[6]=totale

    tooltip.html("Italia<br>" +
        "<p style='color:red'>Totale casi: " + datiNazionali[6] + "</p>" +
        "<p style='color:darkgoldenrod'>Attualmente positivi: " + datiNazionali[2] + "</p>" +
        "<p style='color:darkgoldenrod'>Nuovi Attualmente Positivi: " + datiNazionali[3] + " (+" + parseFloat(increaseperc).toPrecision(2) + "%)" + "</p>" +
        "<p style='color:green'>Guariti: " + datiNazionali[4] + "</p>" +
        "<p style='color:grey'>Deceduti: " + datiNazionali[5] + "</p>" +
        "<p style='color:black'>Terapia Intensiva: " + datiNazionali[0] + "</p>" +
        "<p style='color:black'>Totale Ospedalizzati: " + datiNazionali[1] + "</p>" + "<br>" +
        "Dati aggiornati al: " + datiNazionali[7].toString().split("T", 1))
        .style("display", "block")
        ;

    provinces = g.append("g")
        //.attr("id", "provinces")
        .selectAll("path")
        .data(topojson.feature(json, json.objects.provinces).features)
        .enter()
        .append("path")
        .attr("fill", function (d) {
            var formattedNumber = ("00" + d.properties.prov_istat_code_num).slice(-3);
            return provColor(datiProv.get(formattedNumber));
        })
        .attr("d", path)
        .attr("id", function (d, i) {
            return "Provincia" + d.properties.prov_name;
        })
        .attr("class", "provinces")
        .on("mouseover", function (d, i) {
            d3.select("#ProvLabel" + d.properties.prov_name).style("display", "block");
        })
        .on("mouseout", function (d, i) {
            d3.select("#ProvLabel" + d.properties.prov_name).style("display", "none");
        })
        .on("click", function (d, i) {
            var formattedNumber = ("00" + d.properties.prov_istat_code_num).slice(-3);
            tooltip.html(d.properties.prov_name + "<br>" +
                //  "<p style='color:red'>Codice provincia: " + d.properties.prov_istat_code_num + "</p>" +
                "<p style='color:red'>Totale Casi: " + datiProv.get(formattedNumber) + "</p>")
                .style("display", "block")
                ;
        });

    labelsProv = provinces.append("g")
        .select("body > div > svg > g > g:nth-child(1)")
        //.attr("id","text")
        .data(topojson.feature(json, json.objects.provinces).features)
        .enter()
        .append("svg:text")
        .text(function (d) {
            if (d.properties.prov_name == "Reggionellemilia") {
                return "Reggio nell' Emilia"
            } else if (d.properties.prov_name == "Reggiodicalabria") {
                return "Reggio di Calabria";
            } else if (d.properties.prov_name == "Vibovalentia") {
                return "Vibo Valentia";
            } else if (d.properties.prov_name == "LAquila") {
                return "L' Aquila";
            } else if (d.properties.prov_name == "AscoliPiceno") {
                return "Ascoli Piceno";
            } else if (d.properties.prov_name == "PesaroUrbino") {
                return "Pesaro e Urbino";
            } else if (d.properties.prov_name == "LaSpezia") {
                return "La Spezia";
            } else if (d.properties.prov_name == "MonzaBrianza") {
                return "Monza e della Brianza";
            } else if (d.properties.prov_name == "ValledAosta") {
                return "Aosta";
            } else if (d.properties.prov_name == "SudSardegna") {
                return "Sud Sardegna";
            } else {
                return d.properties.prov_name;
            }
        })
        .attr("x", function (d) {
            if (d.properties.prov_name == "LaSpezia") {
                return path.centroid(d)[0] - 20;
            } else if (d.properties.prov_name == "PesaroUrbino") {
                return path.centroid(d)[0] + 20;
            } else return path.centroid(d)[0];
        })
        .attr("y", function (d) {
            return path.centroid(d)[1];
        })
        .attr("text-anchor", "middle")
        .attr('font-size', '6pt')
        //.on("click", clicked);
        .attr("id", function (d, i) {
            return "ProvLabel" + d.properties.prov_name;
        })
        .attr("class", "ProvLabel")
        .on("mouseover", function (d, i) {
            d3.select(this).style("display", "block");
        })
        .on("mouseout", function (d, i) {
            d3.select(this).style("display", "none");
        })
        .on("click", function (d, i) {
            var formattedNumber = ("00" + d.properties.prov_istat_code_num).slice(-3);
            tooltip.html(d.properties.prov_name + "<br>" +
                /*"<p style='color:red'>Codice provincia: " + d.properties.prov_istat_code_num + "</p>" +*/
                "<p style='color:red'>Totale Casi: " + datiProv.get(formattedNumber) + "</p>")
                .style("display", "block")
                ;
        });


    regions = g.append("g")
        //.attr("id", "regions")
        .selectAll("path")
        .data(topojson.feature(json, json.objects.regions).features)
        .enter()
        .append("path")
        .attr("fill", function (d) {
            return color(datiRegionali.get(d.properties.reg_istat_code)[2]);
        })
        .attr("d", path)
        .attr("id", function (d, i) {
            return d.properties.reg_name;
        })
        .attr("class", "regions")
        .on("click", clicked);



    labels = regions.append("g")
        .select("body > div > svg > g > g:nth-child(2)")
        //.attr("id","text")
        .data(topojson.feature(json, json.objects.regions).features)
        .enter()
        .append("svg:text")
        .text(function (d) {
            if (d.properties.reg_name == "ValledAosta") {
                return "Valle d'Aosta";
            } else if (d.properties.reg_name == "Trentino") {
                return "Trentino-Alto Adige"
            } else if (d.properties.reg_name == "Friuli") {
                return "Friuli-Venezia Giulia"
            } else {
                return d.properties.reg_name;
            }
        })
        .attr("x", function (d) {
            return path.centroid(d)[0];
        })
        .attr("y", function (d) {
            return path.centroid(d)[1];
        })
        .attr("text-anchor", "middle")
        .attr('font-size', '6pt')
        .attr("id", function (d, i) {
            return d.properties.reg_name;
        })
        .attr("class", "regionsLabel")
        .on("click", clicked);

    g.append("path")
        .datum(topojson.mesh(json, json.objects.regions, function (a, b) { return a !== b; }))
        .attr("id", "regions-borders")
        .attr("d", path);

}

function clicked(d) {

    if (d3.select('.background').node() === this) {
        tooltip.html("Italia<br>" +
            "<p style='color:red'>Totale casi: " + datiNazionali[6] + "</p>" +
            "<p style='color:darkgoldenrod'>Attualmente positivi: " + datiNazionali[2] + "</p>" +
            "<p style='color:darkgoldenrod'>Nuovi Attualmente Positivi: " + datiNazionali[3] + " (+" + parseFloat(increaseperc).toPrecision(2) + "%)" + "</p>" +
            "<p style='color:green'>Guariti: " + datiNazionali[4] + "</p>" +
            "<p style='color:grey'>Deceduti: " + datiNazionali[5] + "</p>" +
            "<p style='color:black'>Terapia Intensiva: " + datiNazionali[0] + "</p>" +
            "<p style='color:black'>Totale Ospedalizzati: " + datiNazionali[1] + "</p>" + "<br>" +
            "Dati aggiornati al: " + datiNazionali[7].toString().split("T", 1))
            .style("display", "block")
            ;
        return reset(d);
    }
    //if (active.node() === this) return reset();

    tooltip.html(d.properties.reg_name + "<br>" +

        "<p style='color:red'>Totale casi: " + datiRegionali.get(d.properties.reg_istat_code)[6] + "</p>" +
        "<p style='color:darkgoldenrod'>Attualmente positivi: " + datiRegionali.get(d.properties.reg_istat_code)[2] + "</p>" +
        "<p style='color:darkgoldenrod'>Nuovi Attualmente Positivi: " + datiRegionali.get(d.properties.reg_istat_code)[3] + " (+" + datiRegionali.get(d.properties.reg_istat_code)[7] + "%)" + "</p>" +
        "<p style='color:green'>Guariti: " + datiRegionali.get(d.properties.reg_istat_code)[4] + "</p>" +
        "<p style='color:grey'>Deceduti: " + datiRegionali.get(d.properties.reg_istat_code)[5] + "</p>" +
        "<p style='color:black'>Terapia Intensiva: " + datiRegionali.get(d.properties.reg_istat_code)[0] + "</p>" +
        "<p style='color:black'>Totale Ospedalizzati: " + datiRegionali.get(d.properties.reg_istat_code)[1] + "</p>" + "<br>" +
        "Dati aggiornati al: " + datiRegionali.get(d.properties.reg_istat_code)[8].toString().split("T", 1))
        .style("display", "block")
        ;

    // Determine if current line is visible
    var active = d3.selectAll("#" + d.properties.reg_name).active ? false : true,
        newOpacity = active ? "none" : "block";


    //Darken other regions
    d3.selectAll(".regions").style("fill", "#6a2225");
    // Hide or show the elements
    d3.selectAll(".regions").style("display", "block");
    d3.selectAll(".regionsLabel").style("display", "block");

    d3.selectAll("#" + d.properties.reg_name).style("display", newOpacity);

    // Update whether or not the elements are active
    active = false;

    var bounds = path.bounds(d),
        dx = bounds[1][0] - bounds[0][0],
        dy = bounds[1][1] - bounds[0][1],
        x = (bounds[0][0] + bounds[1][0]) / 2,
        y = (bounds[0][1] + bounds[1][1]) / 2,
        scale = .9 / Math.max(dx / width, dy / height),
        translate = [width / 2 - scale * x, height / 2 - scale * y];

    svg.transition()
        .ease(d3.easeBackIn)
        .duration(1200)
        .call(
            zoom.transform,
            d3.zoomIdentity.translate(width / 2 - scale * x, height / 1.6 - scale * y)
                .scale(.9 / Math.max(dx / width, dy / height))
        );

    g.style("stroke-width", 1.5 / scale + "px");


}

function reset(d) {

    d3.selectAll(".regions").style("display", "block");
    d3.selectAll(".regions").style("fill", function (d) {
        return color(datiRegionali.get(d.properties.reg_istat_code)[2]);
    });
    d3.selectAll(".regionsLabel").style("display", "block");

    svg.transition()
        .ease(d3.easeBackOut)
        .delay(100)
        .duration(1200)
        .call(
            zoom.transform,
            d3.zoomIdentity.translate(10, 10)
        );

    g.style("stroke-width", "1.5px");
}
