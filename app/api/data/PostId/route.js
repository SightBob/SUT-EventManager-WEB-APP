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
        const { id, status, approved_by, rejection_reason } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "ไม่พบ ID ของโพสต์" }, { status: 400 });
        }

        const updateData = {
            status, // 'approved', 'rejected', 'revision', 'pending'
            approved_by,
            updated_at: new Date(),
            approved_at: status === 'approved' ? new Date() : null,
            rejection_reason: (status === 'rejected' || status === 'revision') ? rejection_reason : null,
            revision_count: status === 'revision' ? 
                          (await Post.findById(id)).revision_count + 1 || 1 : 
                          undefined
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
