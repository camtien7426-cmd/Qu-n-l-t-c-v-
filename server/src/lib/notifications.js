// Người 4 chỉ gọi hàm này khi giao việc. Người 6 sẽ hoàn thiện phần thông báo (có thể thay thân hàm).
import { prisma } from "./prisma.js";

export async function notifyTaskAssigned(task, actorId) {
  if (!task.assigneeId || task.assigneeId === actorId) return; // không tự thông báo cho chính mình
  await prisma.notification.create({
    data: {
      type: "TASK_ASSIGNED",
      message: `Bạn được giao công việc: ${task.title}`,
      userId: task.assigneeId,
      projectId: task.projectId,
      taskId: task.id,
    },
  });
}
