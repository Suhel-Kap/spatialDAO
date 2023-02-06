import {ActionIcon, Avatar, Badge, Group, Paper, Stack, Text} from "@mantine/core";
import makeBlockie from "ethereum-blockies-base64"
import * as dayjs from "dayjs"
import relativeTime from 'dayjs/plugin/relativeTime'
import {IconHeart, IconMoodXd, IconThumbDown, IconTrash} from "@tabler/icons";
import {useContext, useEffect, useState} from "react";
import {GlobalContext} from "../contexts/GlobalContext";
import {showNotification, updateNotification} from "@mantine/notifications";
import {useRouter} from "next/router";
// @ts-ignore
import {daoFactoryAddress} from "../constants";


dayjs.extend(relativeTime)


export default function PostCard(props: any) {
    const time = dayjs.unix(props.post.timestamp)
    const router = useRouter()
    const [likes, setLikes] = useState(props.post.count_likes)
    const [downvotes, setDownvotes] = useState(props.post.count_downvotes)
    const [haha, setHaha] = useState(props.post.count_haha)
    const [likeColor, setLikeColor] = useState("gray")
    const [downvoteColor, setDownvoteColor] = useState("gray")
    const [hahaColor, setHahaColor] = useState("gray")
    const [encrypted, setEncrypted] = useState(false)
    const [body, setBody] = useState("")
    // @ts-ignore
    const {orbis} = useContext(GlobalContext)
    


    const handleDelete = async () => {
        showNotification({
            id: "post-delete",
            title: "Deleting...",
            message: "Please wait while we delete your post.",
            loading: true,
            disallowClose: true,
        })
        const res = await orbis.deletePost(props.post.stream_id)
        if (res.status === 200) {
            updateNotification({
                id: "post-delete",
                title: "Post Deleted",
                message: "Your post has been deleted.",
                color: "green",
                disallowClose: true,
            })
            router.reload()
        } else {
            updateNotification({
                id: "post-delete",
                title: "Error",
                message: "There was an error deleting your post.",
                color: "red",
                disallowClose: true,
            })
        }
    }
    const handleLike = async () => {
        const res = await orbis.react(props.post.stream_id, "like")
        if (res.status === 200) {
            setLikes(likes + 1)
            setLikeColor("pink")
            showNotification({
                title: "Liked!",
                message: "You liked this post.",
            })
        } else {
            showNotification({
                title: "Error",
                message: "There was an error liking this post.",
                color: "red",
            })
        }
    }

    const handleDownvote = async () => {
        const res = await orbis.react(props.post.stream_id, "downvote")
        if (res.status === 200) {
            setDownvotes(downvotes + 1)
            setDownvoteColor("red")
            showNotification({
                title: "Downvoted!",
                message: "You downvoted this post.",
            })
        } else {
            showNotification({
                title: "Error",
                message: "There was an error downvoting this post.",
                color: "red",
            })
        }
    }

    const handleHaha = async () => {
        const res = await orbis.react(props.post.stream_id, "haha")
        if (res.status === 200) {
            setHaha(haha + 1)
            setHahaColor("yellow")
            showNotification({
                title: "Haha!",
                message: "You reacted with haha to this post.",
            })
        } else {
            showNotification({
                title: "Error",
                message: "There was an error reacting to this post.",
                color: "red",
            })
        }
    }

    return (
        <Paper my={"md"} p={"md"} radius={"lg"}>
            <Stack>
                <Group position={"apart"}>
                    <Group>
                        <Avatar size={45} radius={45} component={"a"}
                                href={`/user/?address=${props.post.creator_details.metadata.address}`}
                                src={props.post.creator_details?.profile?.pfp || makeBlockie(props.post.creator_details.metadata.address)}/>
                        <div>
                            <Text size={"sm"}>
                                {props.post?.creator_details?.profile?.username}
                            </Text>
                            <Badge color={"teal"} variant={"outline"} size={"sm"}>
                                {props.post.creator_details?.metadata?.ensName || props.post.creator_details?.metadata?.address.slice(0, 4) + "..." + props.post.creator_details?.metadata?.address.slice(-4)}
                            </Badge>
                        </div>
                    </Group>
                    <Text size={"xs"} color={"dimmed"}>
                        {time.fromNow()}
                    </Text>
                </Group>
                <Text>
                    {!encrypted && props.post.content.body}
                    {encrypted && body}
                </Text>
                <Group>
                    <Group>
                        <ActionIcon color={likeColor} onClick={handleLike}>
                            <IconHeart color={likeColor}/>
                        </ActionIcon>
                        <Text>
                            {likes}
                        </Text>
                    </Group>
                    <Group>
                        <ActionIcon color={downvoteColor} onClick={handleDownvote}>
                            <IconThumbDown color={downvoteColor}/>
                        </ActionIcon>
                        <Text>
                            {downvotes}
                        </Text>
                    </Group>
                    <Group>
                        <ActionIcon color={hahaColor} onClick={handleHaha}>
                            <IconMoodXd color={hahaColor}/>
                        </ActionIcon>
                        <Text>
                            {haha}
                        </Text>
                    </Group>
                    {router.pathname === "/Profile" && <Group>
                        <ActionIcon onClick={handleDelete}>
                            <IconTrash color={"red"}/>
                        </ActionIcon>
                    </Group>}
                </Group>
            </Stack>
        </Paper>
    )
}
