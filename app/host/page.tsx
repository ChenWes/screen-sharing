"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Monitor, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Peer from "peerjs";
import { useEffect, useState } from "react";
import { ShareOptions } from "./_components/ShareOptions";

export default function HostPage() {
    const [roomId, setRoomId] = useState("");
    const [peer, setPeer] = useState<Peer | null>(null);
    const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
    const [connections, setConnections] = useState<string[]>([]);
    const { toast } = useToast();
    const router = useRouter();

    /**
     * 事件加载
     */
    useEffect(() => {
        try {
            /**
             * 连接
             */
            const newPeer = new Peer({ debug: 2 });
            setPeer(newPeer);

            newPeer.on("open", (id) => {
                setRoomId(id);
            });

            newPeer.on("connection", (connection) => {
                setConnections((prev) => [...prev, connection.peer]);

                connection.on("close", () => {
                    setConnections((prev) => prev.filter((peerId) => peerId !== connection.peer));
                });
            });

            /**
             * 退出函数
             * 清除peer
             */
            return () => {
                newPeer.destroy();
            };
        } catch (error) {
            console.error("Error initializing peer:", error);
        }
    }, []);

    useEffect(() => {
        /**
         * 连接对象为空则返回
         */
        if (!peer) return;

        if (!activeStream) {
            /**
             * 当还没有发送流
             */
            if (connections.length > 0) {
                /**
                 * 提醒
                 */
                toast({
                    title: "New viewer connected",
                    description: "Click to start sharing your screen.",
                    duration: Infinity,
                    action: (
                        <ToastAction
                            altText="Start sharing"
                            onClick={async () => {
                                try {
                                    /**
                                     * 开始分享桌面
                                     * 视频及音频都打开
                                     */
                                    const stream = await navigator.mediaDevices.getDisplayMedia({
                                        video: true,
                                        audio: true
                                    });

                                    /**
                                     * 设置数据流
                                     */
                                    setActiveStream(stream);
                                } catch (err) {
                                    console.error("Screen sharing error:", err);
                                    toast({
                                        title: "Screen sharing error",
                                        description: "Failed to start screen sharing. Please try again.",
                                        variant: "destructive"
                                    });
                                }
                            }}>
                            Start Sharing
                        </ToastAction>
                    )
                });
            }
        } else {
            /**
             * 当已经开始发送流
             */
            connections.forEach((connection) => {
                /**
                 * 连接
                 */
                const call = peer.call(connection, activeStream);

                activeStream.getTracks()[0].onended = () => {
                    call.close();
                    activeStream.getTracks().forEach((track) => track.stop());
                };
            });
        }
    }, [peer, toast, activeStream, connections]);

    /**
     * 断开流
     */
    function endSession() {
        /**
         * 如果有流，则停止流
         */
        if (activeStream) {
            activeStream.getTracks().forEach((track) => track.stop());
            setActiveStream(null);
        }

        /**
         * 关闭peer对象
         */
        if (peer) {
            peer.destroy();
            setPeer(null);
        }

        setConnections([]);
        setRoomId("");

        toast({
            title: "Session ended",
            description: "Your screen sharing session has been terminated."
        });

        /**
         * 回到首页
         */
        router.push("/");
    }

    return (
        <div className="py-8 px-4">
            <div className="max-w-2xl mx-auto space-y-8">
                <Button variant="outline" asChild>
                    <Link href="/" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </Link>
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Monitor className="h-6 w-6" />
                            Your Screen Sharing Room
                        </CardTitle>
                        <CardDescription>Share your room code or link with others to let them view your screen. To share audio as well, ensure you're using Chrome or Edge, and select the option to share a tab.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <ShareOptions roomId={roomId} />

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-gray-500" />
                                <span className="text-sm text-gray-500">Current Viewers</span>
                            </div>
                            <span className="text-lg font-semibold">{connections.length}</span>
                        </div>

                        {activeStream && (
                            <div className="flex justify-end pt-4">
                                <Button variant="destructive" onClick={endSession} className="flex items-center gap-2">
                                    Stop sharing
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
