const _net = require("net");

const defaults = {
    host: "localhost",
    port: 11211,
    Timeout: 10000
};

const mode = process.env.MODE || "production";

const VALUE_MSG = /(VALUE)\s(\S+)\s(\d+)\s(\d+)/;

function devMode(){
    return mode === "dev";
}

function Memcache( options ){
    let config = Object.assign( {}, defaults, options );
    this.host = config.host;
    this.port = config.port;
    this.timeout = config.timeout;
}

function send(host, port, message){
    return new Promise( (resolve, reject)=>{
        try{
            let client = _net.connect({host:host, port:port});
            let response = "";
            client.on("data", data=>{response+=data;client.end()});
            client.on("end", ()=>resolve(response));
            if( devMode() ){
                console.log( `SEND ${message}`);
            }
            client.write(message);
        } catch( err ){
            reject(err);
        }
    });
}

function parseKeyValueHeader(header){
    let tokens = VALUE_MSG.exec(header);
    if( tokens ){
        if( tokens.length >= 4 ){
            return Object.assign(
                {},
                { key : tokens[2] },
                { flags : tokens[3] },
                { length : tokens[4] }
            );
        } 
    }
    return {};
}

function parseKeyValue(data){
    data = data || [];
    if( data.length > 2 ){
        return Object.assign(
            {},
            parseKeyValueHeader(data[0]),
            {data:data[1]}
        );
    }
    return data;
}

function parseKeyDumps( data ){
    data = data || [];
    return data
        .map( i=>i.split("\r\n") )
        .reduce( (arr,i)=>arr.concat(i), [] )
        .filter( i=> /^ITEM/.test(i) )
        .map( i=>i.replace("ITEM","").trim())
        .map( i=>i.split(" ") )
        .map( i=>Object.assign({}, {key: i[0]}, {details:i.slice(1).join(" ")}));
}

Memcache.prototype = {
    info(){
        console.log( `${this.host}:${this.port}` );
    },
    stats(){
        return send( this.host, this.port, "stats\r\n");
    },
    slabStats(){
        return send( this.host, this.port, "stats slabs\r\n");
    },
    slabCount(){
        return this.slabStats()
            .then(data=>data.split("\r\n"))
            .then(lines=>lines.filter(i=>/active_slabs/.test(i))[0])
            .then(line=>line.split(' '))
            .then(tokens=>parseInt(tokens.filter(i=>parseInt(i))[0]));
    },
    getKeys(){
        return this.slabCount()
        .then(count=>{
            let keyDumps = [];
            for( let i = 1; i <= count; i++ ){
                keyDumps.push( this.dump(i) );
            }
            return Promise.all(keyDumps);
        })
        .then(parseKeyDumps);
    },
    get(key){
        return send( this.host, this.port, `get ${key}\r\n`).then(res=>res.split("\r\n")).then(res=>parseKeyValue(res));
    },
    set(key, data, flags, ttl ){
        ttl = ttl || 60;
        return send( this.host, this.port, `set ${key} ${flags} ${ttl} ${data.length}\r\n${data}\r\n` );
    },
    dump(id){
        return send( this.host, this.port, `stats cachedump ${id} 0\r\n` );
    }
}

module.exports = Memcache;
