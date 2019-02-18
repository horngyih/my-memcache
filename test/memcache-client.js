const assert = require("assert");
const Memcache = require("../src/memcache-client");

const testKeys = require("./testkeys");

function createClient(){
    return new Memcache({host:"dockerhost"});
}

describe("Memcache", ()=>{
    it("Should have a Memcache object", ()=>{
        assert(Memcache);
    });
    it("Should be able to call stats", (done)=>{
        createClient()
        .stats()
        .then(res=>{
            console.log(res);
            assert(res);
            done();
        });
    });
    it("Should be able to set key", (done)=>{
        let client = createClient();
        client.set(testKeys[0].key, testKeys[1].value, 0, 300)
        .then(res=>{
            assert(res);
            done();
        });
    });
    it("Should be able to retrieve key", (done)=>{
        let client = createClient();
        let testKey = testKeys[0];
        client.set(testKey.key, testKey.value, 0, 300 )
        .then(()=>{
            client.get(testKey.key)
                .then(res=>{
                    console.log(res);
                    assert.equal(testKey.value, res.data);
                    assert.equal(testKey.value, res.data);
            })
            .then(done)
            .catch(done);
        });
    });
});
