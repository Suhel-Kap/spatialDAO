import {daoFactoryAddress} from "../constants";

const API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
const CONTRACT = daoFactoryAddress["dao-factory"]

export async function getOwnersForNft(tokneId: string) {
    const res = await fetch(`https://polygon-mumbai.g.alchemy.com/nft/v2/${API_KEY}/getOwnersForToken?contractAddress=${CONTRACT}&tokenId=${tokneId}`)
    return await res.json()
}