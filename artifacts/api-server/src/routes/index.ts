import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import storageRouter from "./storage";
import usersRouter from "./users";
import profilesRouter from "./profiles";
import listingsRouter from "./listings";
import leadsRouter from "./leads";
import mandatesRouter from "./mandates";
import dashboardRouter from "./dashboard";
import anthropicRouter from "./anthropic";
import reportsRouter from "./reports";
import programsRouter from "./programs";
import documentsRouter from "./documents";
import demolitionRouter from "./demolition";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(storageRouter);
router.use(usersRouter);
router.use(profilesRouter);
router.use(listingsRouter);
router.use(leadsRouter);
router.use(mandatesRouter);
router.use(dashboardRouter);
router.use(anthropicRouter);
router.use(reportsRouter);
router.use(programsRouter);
router.use(documentsRouter);
router.use(demolitionRouter);

export default router;
