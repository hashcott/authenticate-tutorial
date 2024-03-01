"use server";

import Image from "next/image";

export default async function Home() {
    const getPosts = async () => {
        // gọi api để lấy dữ liệu và cache lại (Important: cache lại dữ liệu để tránh gọi api nhiều lần)
        const res = await fetch(
            "https://65dc9c32e7edadead7ec886e.mockapi.io/posts",
            { cache: "force-cache" }
        );
        const data = await res.json();
        return data;
    };
    const renderPosts = async () => {
        const posts = await getPosts();
        return posts.map((post) => (
            <div key={post.id}>
                <h2>{post.title}</h2>
                <p>{post.content}</p>
                <Image
                    src="/hello.jpg"
                    alt={post.title}
                    width={4160}
                    height={6240}
                />
            </div>
        ));
    };
    return <main>{renderPosts()}</main>;
}
