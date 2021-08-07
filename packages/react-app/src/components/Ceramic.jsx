import React from "react";
import { useState, useEffect } from "react";

//get ceramic JS client
import CeramicClient from '@ceramicnetwork/http-client'

//setup to fee read/write testnet node ref https://developers.ceramic.network/run/nodes/community-nodes/
const API_URL = "https://ceramic-clay.3boxlabs.com"

//create instance
const ceramic = new CeramicClient(API_URL)

//Auth 
//import provider
//import { Ed25519Provider } from 'key-did-provider-ed25519'
//get seed for DID 
//import { randomBytes } from '@stablelib/random'
//const seed = randomBytes(32)
//create provider instance 
//const provider = new Ed25519Provider(seed)
//create DID instance
//import { DID } from 'dids'

//const provider = new Ed25519Provider(seed)
//const resolver = KeyDidResolver.getResolver()
//ceramic.did = new DID({ provider, resolver })

export default function ceramicTest () {

    const getData = async() => { 
        const TileDocument = require('@ceramicnetwork/stream-tile');
        const data = await ceramic.loadStream('kjzl6cwe1jw146huhfhvxio2had29ptcld1l4im1h8s3hjzwdk16gac7vrezz11')
        console.log(data.content)
    } 

    return <button> {data.content}</button>

}

