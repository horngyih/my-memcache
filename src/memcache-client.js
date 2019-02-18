const _net = require("net");

const defaults = {
    host: "localhost",
    port: 11211,
    timeout: 10000
};

function Memcache( options ){
    let config = Object.assign( {}, defaults, options );
    console.log( "Config");
    this.host = config.host;
    this.port = config.port;
    this.timeout = config.timeout;
}

function send(host, port, message){
    return new Promise( (resolve, reject)=>{
        try{
            let client = _net.connect({host:host, port:port},()=>console.log("Connected..."));
            let response = "";
            client.on("data", data=>{response+=data;client.end()});
            client.on("end", ()=>resolve(response));
            client.write(message);
        } catch( err ){
            reject(err);
        }
    });
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
    get(key){
        return send( this.host, this.port, `get ${key}\r\n`);
    },
    set(key, data, flags ){
        return send( this.host, this.port, `set ${key} ${flags} ${data.length}\r\n${data}\r\n'` );
    },
    dump(id){
        retrun send( this.host, this.port, `stats cachedump ${id} 0\r\n` );
    }
}

module.exports = Memcache;
