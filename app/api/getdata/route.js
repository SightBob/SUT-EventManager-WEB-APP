import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/ConnectDB";
import Post from "@/models/Post";
import User from "@/models/User";

// GET: ดึงข้อมูลโพสต์ทั้งหมดพร้อมข้อมูลผู้ใช้
export async function GET(req) {
    try {
        await dbConnect();
        
        // ดึงเพสต์ทั้งหมด
        const posts = await Post.find()
            .sort({ created_at: -1 });

        // ดึง ID ของผู้สร้างโพสต์ทั้งหมด
        const organizerIds = posts.map(post => post.organizer_id);

        // ดึงข้อมูลผู้ใช้ที่เกี่ยวข้อง
        const users = await User.find({ uuid: { $in: organizerIds } });

        // สร้าง map ของ username
        const userMap = {};
        users.forEach(user => {
            userMap[user.uuid] = user.username;
        });

        // เพิ่ม username เข้าไปในข้อมูลโพสต์
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

// PUT: อัพเดทสถานะการอนุมัติ
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
            rejection_reason: status === 'rejected' ? rejection_reason : null
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


