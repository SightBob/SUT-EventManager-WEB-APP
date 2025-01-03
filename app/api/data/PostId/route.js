import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/ConnectDB";
import Post from "@/models/Post";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    await dbConnect();

    const getPost = await Post.findById(id);
    
    if(getPost) {
      
      const nameOrganizer = await User.findById(getPost.organizer_id);
      return NextResponse.json({
        post: {
          getPost,
          nameOrganizer
        },
      }, { status: 200 });
    }

  } catch (error) {
    console.error("Error: ", error);
    return NextResponse.json({
      message: "Internal Server Error",
    }, { status: 500 });
  }
}

export async function PUT(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const data = await req.json();

        if (!id) {
            return NextResponse.json({ error: "ไม่พบ ID ของโพสต์" }, { status: 400 });
        }

        // ตรวจสอบว่าเป็นการอัพเดทสถานะหรือข้อมูลทั้งหมด
        let updateData;
        if (data.status && (data.status === 'approved' || data.status === 'rejected' || data.status === 'revision')) {
            // กรณีอัพเดทสถานะ
            updateData = {
                status: data.status,
                approved_by: data.approved_by,
                updated_at: new Date(),
                approved_at: data.status === 'approved' ? new Date() : null,
                rejection_reason: (data.status === 'rejected' || data.status === 'revision') ? data.rejection_reason : null,
                revision_count: data.status === 'revision' ? 
                            (await Post.findById(id)).revision_count + 1 || 1 : 
                            undefined
            };
        } else {
            // กรณีอัพเดทข้อมูลทั้งหมด
            updateData = {
                title: data.title,
                start_date: data.start_date,
                start_time: data.start_time,
                end_date: data.end_date,
                end_time: data.end_time,
                location: data.location,
                description: data.description,
                picture: data.picture,
                public_id: data.public_id,
                category: data.category,
                link_other: data.link_other,
                member: data.member,
                maxParticipants: data.maxParticipants,
                description_image_ids: data.description_image_ids,
                register_start_date: data.register_start_date,
                register_start_time: data.register_start_time,
                register_end_date: data.register_end_date,
                register_end_time: data.register_end_time,
                status: data.status,
                rejection_reason: data.rejection_reason,
                updated_at: new Date()
            };
        }

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
        return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัพเดทส้อมูล" }, { status: 500 });
    }
}
