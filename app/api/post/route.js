import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/ConnectDB";
import Post from "@/models/Post";
import Notification from "@/models/Notification";
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(req) {
    try {
        await dbConnect();

        const { uuid, additionalLink, start_date, start_time, end_date, end_time, description, picture, location, tags, title, type, member, maxParticipants, public_id, description_image_ids, register_start_date, register_start_time, register_end_date, register_end_time } = await req.json();
 
        const newpost = await Post.create({
            organizer_id: uuid,
            title,
            description,
            location,
            picture,
            public_id,
            category: tags,
            start_date,
            start_time,
            end_date,
            end_time,
            type,
            member, 
            description_image_ids,
            maxParticipants,
            link_other: additionalLink,
            register_start_date,
            register_start_time,
            register_end_date,
            register_end_time,
            status: 'pending',
            approved_by: null,
            approved_at: null,
            rejection_reason: null,
            is_verified_organizer: false,
            admin_notes: null
        });
        

        if(newpost && start_time){

            const formattedTime = start_time.replace(".", ":");

            const combinedDateTimeUTC = new Date(`${start_date}T${formattedTime}:00.000Z`);

            const adjustedDateTime = new Date(combinedDateTimeUTC.getTime() - 7 * 60 * 60 * 1000);

            const finalDateTime = new Date(adjustedDateTime.getTime() - 1 * 24 * 60 * 60 * 1000);

            const DateTimeNotification = finalDateTime.toISOString().replace("Z", "+00:00");

            const notificationTitle = `เชิญชวนเข้าร่วมกิจกรรม "${title}"`;
            const notificationMessage = `ขอเชิญชวนนักศึกษาและบุคลากรทุกท่านเข้าร่วมกิจกรรม "${title}" ซึ่งจะจัดขึ้นในวันที่ "${start_date}" เวลา "${start_time}" เพื่อเป็นโอกาสในการเรียนรู้และแลกเปลี่ยนประสบการณ์ หวังว่าจะได้พบทุกท่านในงานนี้ครับ/ค่ะ`;

            const newNotification = await Notification.create({
                title: notificationTitle,
                message: notificationMessage,
                type: member === 'yes' ? "auto" : "manual",
                isRead: false,
                postId: newpost._id,
                readed: [],
                createdAt: new Date(),
                scheduledTime: DateTimeNotification
            })

            return NextResponse.json({
                newNotification,
                newpost
            }, { status: 201 })
            
        }else {

            return NextResponse.json({
                newpost
            }, { status: 201 })

        }

    } catch (error) {
        console.error("เกิดข้อผิดพลาด:", error);
        return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสร้างโพสต์" }, { status: 500 });
    }
}


export async function DELETE(request) {
    try {
        await dbConnect();
        
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        console.log("Attempting to delete post with ID:", id);

        if (!id) {
            return NextResponse.json({ 
                error: "กรุณาระบุ ID ของโพสต์ที่ต้องการลบ" 
            }, { status: 400 });
        }

        // ลึงข้อมูลโพสต์ก่อนลบ
        const post = await Post.findById(id);
        
        if (!post) {
            return NextResponse.json({ 
                error: "ไม่พบโพสต์ที่ต้องการลบ" 
            }, { status: 404 });
        }

        // ลบรูปภาพหลักจาก Cloudinary
        if (post.public_id) {
            try {
                await cloudinary.uploader.destroy(post.public_id);
            } catch (error) {
                console.error("Error deleting main image:", error);
            }
        }

        // ลบรูปภาพใน description จาก Cloudinary
        if (post.description_image_ids?.length > 0) {
            const deletePromises = post.description_image_ids.map(imageId => 
                cloudinary.uploader.destroy(imageId)
            );
            try {
                await Promise.all(deletePromises);
            } catch (error) {
                console.error("Error deleting description images:", error);
            }
        }

        // ลบโพสต์จากฐานข้อมูล
        const deletedPost = await Post.findByIdAndDelete(id);
        
        // ลบการแจ้งเตือนที่เกี่ยวข้อง
        await Notification.deleteMany({ postId: id });

        return NextResponse.json({ 
            message: "ลบโพสต์และรูปภาพทั้งหมดเรียบร้อยแล้ว",
            deletedPost 
        }, { status: 200 });

    } catch (error) {
        console.error("Error in DELETE route:", error);
        return NextResponse.json({
            error: "เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง",
            details: error.message
        }, { status: 500 });
    }
}

export async function GET(){
    try {
        await dbConnect();

        const getAllPost = await Post.find()
            .sort({ created_at: -1 });
        
        if(!getAllPost){
            return NextResponse.json({
                message: 'no post in database',
            },{ status: 404 });
        }

        return NextResponse.json({
            getAllPost,
        },{ status: 201 });

    } catch (error) {
        console.log("Error get all post: ", error);
        return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 });
    }
}