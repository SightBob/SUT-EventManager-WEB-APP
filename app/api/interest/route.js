const { NextResponse } = require("next/server");
import { dbConnect } from "@/lib/ConnectDB";
import User from "@/models/User";
import Post from "@/models/Post";

export async function POST(req) {
    try {
        await dbConnect();
        
        const { uuid, interests } = await req.json();
        
        const updatedUser = await User.findOneAndUpdate(
            { _id: uuid },
            { $set: { preferred_categories: interests, verifyCategories: true } }, 
            { new: true, runValidators: true }
        );
        
        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        
        return NextResponse.json({
            message: "User interests updated successfully",
            verify_categories: true
        }, { status: 200 });
    } catch (error) {
        console.error("Request processing error:", error);
        return NextResponse.json({ error: "Failed to update user interests" }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const idUser = searchParams.get('user');

        await dbConnect();

        let getPost;

        if (!idUser) {
            getPost = await Post.find({ status: 'approved' }).sort({ createdAt: -1 }).limit(8);
            return NextResponse.json({ message: "ข้อมูลทั้งหมด", getPost });
        } else {

            const user = await User.findById(idUser);
            if (!user) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }
            
            // ถ้า user ไม่มี preferred_categories ให้ดึงโพสต์ทั่อนุมัติแล้วทั้งหมด
            if (user.preferred_categories.length === 0) {
                getPost = await Post.find({ status: 'approved' }).sort({ createdAt: -1 }).limit(6);
            } else {
                getPost = await Post.find({
                    category: { $in: user.preferred_categories },
                    status: 'approved'
                }).sort({ createdAt: -1 }).limit(8);
            }

            return NextResponse.json({ getPost });
        }

    } catch (error) {
        console.error("Error get interesting: ", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}