"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth, currentUser } from "@clerk/nextjs"

import { database } from "@/db/drizzle"
import { getCourseById, getUserProgress } from "@/db/queries"
import { userProgress } from "@/db/schema"

export const upsertUserProgress = async (courseId: number) => {
    const { userId } = await auth()
    const user = await currentUser()

    if (!userId || !user) {
        throw new Error("Unauthorized!")
    }

    const course = await getCourseById(courseId)

    if (!course) {
        throw new Error("Course not found!")
    }

    // TODO: Enable once units and lessons are added
    // if (!course.units.length || !course.units[0].lessons.length) {
    //     throw new Error("Course is empty!")
    // }

    const existingUserProgress = await getUserProgress()

    if (existingUserProgress) {
        await database.update(userProgress).set({
            activeCourseId: courseId,
            userName: user.firstName || "User",
            userImageSrc: user.imageUrl || "/ic_mascot.svg",
        })

        revalidatePath("/courses")
        revalidatePath("/learn")
        redirect("/learn")
    }

    await database.insert(userProgress).values({
        userId,
        activeCourseId: courseId,
        userName: user.firstName || "User",
        userImageSrc: user.imageUrl || "/ic_mascot.svg",
    })

    revalidatePath("/courses")
    revalidatePath("/learn")
    redirect("/learn")
}
