import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/ConnectDB";
import Post from "@/models/Post";
import User from "@/models/User";

// GET: ดึงข้อมูลโพสต์ทั้งหมดพร้อมข้อมูลผู้ใช้
export async function GET(req) {
    try {
        await dbConnect();
        
        const posts = await Post.find()
            .sort({ created_at: -1 });

        const organizerIds = posts.map(post => post.organizer_id);

        const users = await User.find({ uuid: { $in: organizerIds } });

        const userMap = {};
        users.forEach(user => {
            userMap[user.uuid] = user.username;
        });

        const postsWithUsernames = posts.map(post => ({
            ...post.toObject(),
            username: userMap[post.organizer_id] || 'ไม่ระบุชื่อ'
        }));

        return NextResponse.json(postsWithUsernames, { status: 200 });
    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        await dbConnect();
        const { id, status, approved_by, rejection_reason } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "ไม่พบ ID ของโพสต์" }, { status: 400 });
        }

        const updateData = {
            status,
            approved_by,
            approved_at: status === 'approved' ? new Date() : null,
            rejection_reason: (status === 'rejected' || status === 'revision') ? rejection_reason : null
        };

        const updatedPost = await Post.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );
        
        if (!updatedPost) {
            return NextResponse.json({ error: "ไม่พบโพสต์ที่ต้องการอัพเดท" }, { status: 404 });
        }

        return NextResponse.json(updatedPost, { status: 200 });
    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัพเดทสถานะ" }, { status: 500 });
    }
}

// DELETE: ลบโพสต์
export async function DELETE(req) {
    try {
        await dbConnect();
        
        // รับ ID จาก query parameters
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "ไม่พบ ID ของโพสต์" }, { status: 400 });
        }

        // ลบโพสต์
        const deletedPost = await Post.findByIdAndDelete(id);
        
        if (!deletedPost) {
            return NextResponse.json({ error: "ไม่พบโพสต์ที่ต้องการลบ" }, { status: 404 });
        }

        return NextResponse.json({ message: "ลบโพสต์เรียบร้อย" }, { status: 200 });
    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลบโพสต์" }, { status: 500 });
    }
}


