import {Blob, File, NFTStorage} from "nft.storage"

const useNftStorage = () => {
    const endpoint = "https://api.nft.storage" as any // the default
    const token = process.env.NEXT_PUBLIC_NFT_STORAGE_API_KEY as string

    const storage = new NFTStorage({ endpoint, token })

    const uploadImage = async (file: File) => {
        const blob = new Blob([file], { type: "image/*" })
        return await storage.storeBlob(blob)
    }

    return { uploadImage }

    
}

export default useNftStorage