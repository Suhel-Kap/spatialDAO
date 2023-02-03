import {useContract} from "../hooks/useContract";

interface NftCardProps {
    title: string;
    description?: string;
    tokenId: string;
    numBounties: string;
    spaceName?: string;
    image?: any;
    setModalOpen?: any;
    streamId: string
    timestamp: number
    endDate: string
}

import {
    Card,
    Text,
    createStyles, Button, Modal, Center, Badge,
} from '@mantine/core';
import {useRouter} from "next/router";
import {useContext, useEffect, useState} from "react";
import * as dayjs from "dayjs"
import relativeTime from 'dayjs/plugin/relativeTime'
import {ethers} from "ethers";
import {DAO_abi} from "../constants";
import {useSigner} from "wagmi";
import {showNotification, updateNotification} from "@mantine/notifications";
import Bounty from "./Bounty";
import {GlobalContext} from "../contexts/GlobalContext";

dayjs.extend(relativeTime)

const useStyles = createStyles((theme) => ({
    card: {
        position: 'relative',
        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
        maxWidth: 350
    },

    rating: {
        position: 'absolute',
        top: theme.spacing.xs,
        right: theme.spacing.xs + 2,
        pointerEvents: 'none',
    },

    title: {
        display: 'block',
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.xs / 2,
    },

    action: {
        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
        ...theme.fn.hover({
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1],
        }),
    },

    footer: {
        marginTop: theme.spacing.md,
    },
}));

export default function BountyCard({
                                       title: commP,
                                       tokenId: bountyReward,
                                       streamId, numBounties,
                                       description, timestamp, endDate
                                   }: NftCardProps & Omit<React.ComponentPropsWithoutRef<'div'>, keyof NftCardProps>) {
    const {classes, cx, theme} = useStyles();
    const {data: signer} = useSigner()
    const router = useRouter()
    // @ts-ignore
    const {orbis} = useContext(GlobalContext)

    let address = ""
    if (typeof router.query.address === "string")
        address = router.query.address
    const contract = new ethers.Contract(address, DAO_abi, signer!)
    const {
        getCommpBounty,
        isBountyCreated,
        isValidProposedFile,
        isBountyEnabled,
        getCommpProposal,
        claim_bounty,
        fundBounty
    } = useContract()

    const [buttons, setButtons] = useState(<Button color={"yellow"} fullWidth>Fetching information</Button>)
    const [badgeText, setBadgeText] = useState("Fetching data")
    const [badgeColor, setBadgeColor] = useState("yellow")

    const time = dayjs.unix(timestamp)
    const ending = Math.floor(new Date(endDate).getTime() / 1000)
    const end = dayjs.unix(ending)
    useEffect(() => {
        if (commP && router.query.address && signer) {
            getState()
        }
    }, [commP, router.query.address, signer])

    const getState = async () => {
        const commP_ = await getCommpProposal(contract, commP)
        const res = await getCommpBounty(contract, commP)
        const isBounty = await isBountyCreated(contract, parseInt(commP_[0]))
        const isValid = await isValidProposedFile(contract, commP)
        const isBountyEnabled_ = await isBountyEnabled(contract, commP)
        console.log("isBountyCreated", isBounty)
        console.log("isValidProposedFile", isValid)
        console.log("isBountyEnabled", isBountyEnabled_)
        if (!isBountyEnabled_ && isBounty) {
            setButtons(
                <Button fullWidth color={"green"} onClick={async () => {
                    showNotification({
                        id: "bounty",
                        title: "Creating bounty",
                        message: "Please wait",
                        loading: true,
                        disallowClose: true,
                        autoClose: false,
                    })
                    orbis.isConnected().then((res: any) => {
                        if (res === false){
                            alert("Please connect to orbis first")
                            updateNotification({
                                title: "Bounty Funding Failed",
                                message: "Please connect to orbis first",
                                loading: false,
                                disallowClose: false,
                                autoClose: true,
                                color: "red",
                                id: "bounty"
                            })
                            return
                        }
                    })
                    try {
                        console.log(commP, bountyReward)
                        await fundBounty(contract, commP, bountyReward)
                        await orbis.createPost({
                            context: streamId,
                            body: "Funded bounty for " + commP
                        })
                        updateNotification({
                            id: "bounty",
                            title: "Success",
                            message: "You voted for this proposal",
                            loading: false,
                            disallowClose: false,
                            autoClose: true,
                        })
                    } catch (e) {
                        console.log(e)
                        updateNotification({
                            id: "bounty",
                            title: "Error",
                            message: "Something went wrong",
                            loading: false,
                            disallowClose: false,
                            autoClose: true,
                            color: "red"
                        })
                    }
                }}>Fund Bounty</Button>)
            setBadgeText("Ends " + end.fromNow())
            setBadgeColor("yellow")
        } else if (isBountyEnabled_) {
            setButtons(<Button color={"grape"} fullWidth onClick={async () => {
                showNotification({
                    id: "bounty",
                    title: "Claiming bounty",
                    message: "Please wait",
                    loading: true,
                    disallowClose: true,
                    autoClose: false,
                })
                orbis.isConnected().then((res: any) => {
                    if (res === false){
                        alert("Please connect to orbis first")
                        updateNotification({
                            title: "Bounty Funding Failed",
                            message: "Please connect to orbis first",
                            loading: false,
                            disallowClose: false,
                            autoClose: true,
                            color: "red",
                            id: "bounty"
                        })
                        return
                    }
                })
                try {
                    // TODO: Fix this
                    // @ts-ignore
                    await claim_bounty(contract, commP)
                    await orbis.createPost({
                        context: streamId,
                        body: "Claimed bounty for " + commP
                    })
                    updateNotification({
                        id: "bounty",
                        title: "Success",
                        message: "You executed the proposal",
                        loading: false,
                        disallowClose: false,
                        autoClose: true,
                    })
                } catch (e) {
                    console.log(e)
                    updateNotification({
                        id: "bounty",
                        color: "red",
                        title: "Failed",
                        message: "Something went wrong",
                        loading: false,
                        disallowClose: false,
                        autoClose: true,
                    })
                }
            }}>Claim Bounty</Button>)
            setBadgeText("Waiting for execution")
            setBadgeColor("purple")
        } else if (!isBountyEnabled_ && !isBounty) {
            setButtons(<Button color={"red"} fullWidth>Bounty Fully Funded</Button>)
            setBadgeText("Proposal Declined")
            setBadgeColor("red")
        }
    }

    return (
        <>
            <Card withBorder radius="md" className={cx(classes.card)} m={"md"}>
                <Card.Section p={"sm"}>
                    <Badge color={badgeColor}>{badgeText}</Badge>
                    <Text className={classes.title} lineClamp={4} weight={500}>
                        {commP}
                    </Text>
                    <Text size="xs" color="dimmed" lineClamp={4}>
                        {time.fromNow()}
                    </Text>
                    <Text size="sm" color="dimmed" lineClamp={4}>
                        {description}
                    </Text>
                </Card.Section>
                <Card.Section mt={"md"}>
                    {buttons}
                </Card.Section>
            </Card>
        </>
    );
}