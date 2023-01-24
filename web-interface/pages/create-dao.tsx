import Head from 'next/head'
import {Layout} from "../components/Layout";
import {
    Button,
    Container,
    FileInput,
    Textarea,
    TextInput,
    Text,
    Loader,
    Group,
    Title,
    Divider,
    NativeSelect,
    Accordion, HoverCard, ActionIcon, NumberInput, Checkbox
} from "@mantine/core";
import {IconQuestionMark, IconUpload} from "@tabler/icons";
import {useContext, useEffect, useState} from "react";
import useNftStorage from "../hooks/useNftStorage";
import {showNotification, updateNotification} from "@mantine/notifications";
import {useRouter} from "next/router"
import {nftImages} from "../constants";
import {useAccount} from "wagmi";
import getSpaces from "../utils/getSpaces";
// @ts-ignore
import {Orbis} from "@orbisclub/orbis-sdk";
import {GlobalContext} from "../contexts/GlobalContext";
import {useContract} from "../hooks/useContract";
import {useIsMounted} from "../hooks/useIsMounted";
import {useListState} from "@mantine/hooks";
import {AddressInput} from "../components/AddressInput";
import { MemberList } from '../components/MemberList';

export default function CreateDao() {
    const [daoName, setDaoName] = useState<string>("")
    const [proposers, proposersHandlers] = useListState<string>([]);
    const [voters, votersHandlers] = useListState<string>([]);
    const [loading, setLoading] = useState(false)
    const [spaceDescription, setSpaceDescription] = useState<String>("")
    const {upload, uploadImage} = useNftStorage()
    const {spaceExists, mintSpace} = useContract()
    const router = useRouter()
    const mounted = useIsMounted()
    const {address, isDisconnected} = useAccount()
    const [disabled, setDisabled] = useState(true)
    const [spacePfp, setSpacePfp] = useState<File>()
    // @ts-ignore
    const {orbis, setUser} = useContext(GlobalContext)

    const logout = async () => {
        if (isDisconnected) {
            let res = await orbis.isConnected()
            if (res.status == 200) {
                await orbis.logout()
                setUser(null)
                console.log("User is connected: ", res);
            }
        }
    }

    useEffect(() => {
        logout()
    }, [isDisconnected])

    const handleMintSpace = async () => {
        setLoading(true)
        showNotification({
            id: "space",
            title: "Creating Space",
            message: "Please wait while we create your space",
            loading: true,
            disallowClose: true,
            autoClose: false
        })
        if (daoName && spacePfp) {
            const isSpace = await spaceExists(daoName)
            if (isSpace) {
                updateNotification({
                    id: "space",
                    title: "Error",
                    message: "Space already exists",
                    color: "red",
                    autoClose: 5000
                })
                setLoading(false)
                return
            }
            const cid = await uploadImage(spacePfp!)
            const res = await orbis.createGroup({
                pfp: `https://ipfs.io/ipfs/${cid}`,
                name: daoName,
                description: spaceDescription
            })
            const groupId = res.doc
            console.log(groupId)
            try{
                const groupRes = await orbis.createChannel(groupId, {
                    group_id: groupId,
                    name: "General",
                    description: "General channel for the " + daoName + " space",
                    type: "feed"
                })
                console.log(groupRes)
            } catch (e) {
                console.log(e)
            }

            try {
                await mintSpace(daoName, groupId, cid)
                updateNotification({
                    id: "space",
                    title: "Success",
                    message: "Space has been created",
                    color: "green",
                    autoClose: 5000
                })
                setLoading(false)
                // router.reload()
            } catch (e) {
                console.log(e)
                updateNotification({
                    id: "space",
                    title: "Error",
                    // @ts-ignore
                    message: e.message,
                    color: "red",
                    autoClose: 5000
                })
                setLoading(false)
            }
        } else {
            alert("Please fill all fields")
            setLoading(false)
        }
    }

    const removeProposer = (member: string) => {
        proposersHandlers.filter(
            (other: string) => other.toLowerCase() !== member.toLowerCase()
        );
    };

    const addProposer = (member: string) => {
        removeProposer(member);
        proposersHandlers.append(member);
    };

    const removeVoter = (member: string) => {
        votersHandlers.filter(
            (other: string) => other.toLowerCase() !== member.toLowerCase()
        );
    };

    const addVoter = (member: string) => {
        removeVoter(member);
        votersHandlers.append(member);
    };

    return (
        <>
            <Head>
                <title>Create DAO - SpatialDAO</title>
                <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width"/>
            </Head>
            <Layout>
                <Container>
                    <Title order={1}>Create DAO</Title>
                    <TextInput m={"md"} label={"DAO Name"} value={daoName as string}
                               onChange={(event) => setDaoName(event.currentTarget.value)}
                               placeholder="Name" required/>
                    <Textarea m={"md"} label={"DAO Description"} value={spaceDescription as string} onChange={(event) => setSpaceDescription(event.currentTarget.value)}
                              placeholder="Description" required/>
                    <FileInput m={"md"} required label={"Upload your space image"} placeholder={"Upload image file"}
                               accept={"image/*"} icon={<IconUpload size={14}/>} value={spacePfp as any}
                               onChange={setSpacePfp as any}/>
                    <Text m={"md"} size={"md"}>Add Proposers</Text>
                    <AddressInput onSubmit={addProposer} />
                    <MemberList
                        label="Proposers"
                        members={proposers}
                        editable={true}
                        onRemove={removeProposer}
                    />
                    <Text m={"md"} size={"md"}>Add Voter</Text>
                    <AddressInput onSubmit={addVoter} />
                    <MemberList
                        label="Voters"
                        members={voters}
                        editable={true}
                        onRemove={removeVoter}
                    />
                    <Button color={"indigo"} disabled={loading} m={"md"} onClick={async () => await handleMintSpace()}>Create Space </Button>
                </Container>

            </Layout>
        </>
    )
}
