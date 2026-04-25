import { Router, type IRouter } from "express";
import healthRouter from "./health";
import meRouter from "./me";
import prayersRouter from "./prayers";
import categoriesRouter from "./categories";
import bookmarksRouter from "./bookmarks";
import calendarRouter from "./calendar";
import wallRouter from "./wall";
import donationsRouter from "./donations";
import dashboardRouter from "./dashboard";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(meRouter);
router.use(prayersRouter);
router.use(categoriesRouter);
router.use(bookmarksRouter);
router.use(calendarRouter);
router.use(wallRouter);
router.use(donationsRouter);
router.use(dashboardRouter);
router.use(adminRouter);

export default router;
