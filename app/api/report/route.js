import Report from '@/models/Report';
import { dbConnect } from "@/lib/ConnectDB";
import { NextResponse } from "next/server";
import User from '@/models/User';
import Post from '@/models/Post';

export async function POST(request) {
    await dbConnect(); // เชื่อมต่อกับฐานข้อมูลก่อน
  
    try {
      const { postId, userId, reason } = await request.json();
      
      console.log('Received report data:', { postId, userId, reason });

      // ตรวจสอบค่าที่จำเป็น
      if (!postId || !userId || !reason) {
        return NextResponse.json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
      }

      // สร้างเอกสารการรายงานใหม่
      const newReport = new Report({
        postId,
        reportedBy: userId,
        reason
      });

      await newReport.save();
  
      return NextResponse.json({ success: true, message: 'รายงานสำเร็จ', report: newReport });
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล:", error);
      return NextResponse.json({ 
        success: false, 
        message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 
        error: error.message || 'ไม่มีข้อมูล'
      }, { status: 500 });
    }
}

// เพิ่มฟังก์ชัน GET
export async function GET(request) {
  await dbConnect(); 

  try {
      const reports = await Report.find().populate('reportedBy'); // ค้นหารายงานทั้งหมดและ populate ฟิลด์ reportedBy ถ้ามี

      return NextResponse.json({ success: true, reports });
  } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
      return NextResponse.json({
          success: false,
          message: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
          error: error.message || 'ไม่มีข้อมูล'
      }, { status: 500 });
  }
}


export async function DELETE(request) {
    await dbConnect();

    try {
        const { reportId } = await request.json();

        // ค้นหารายงานก่อนที่จะลบ เพื่อเก็บ postId
        const report = await Report.findById(reportId);
        if (!report) {
            return NextResponse.json({ success: false, message: 'ไม่พบรายงานที่ต้องการลบ' }, { status: 404 });
        }

        // ลบโพสต์ที่ถูกรายงาน
        await Post.findByIdAndDelete(report.postId);

        // ลบรายงาน
        const deletedReport = await Report.findByIdAndDelete(reportId);

        return NextResponse.json({ 
            success: true, 
            message: 'ลบรายงานและโพสต์สำเร็จ', 
            report: deletedReport 
        });
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการลบข้อมูล:", error);
        return NextResponse.json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการลบข้อมูล',
            error: error.message || 'ไม่มีข้อมูล'
        }, { status: 500 });
    }
}
