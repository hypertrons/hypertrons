import { AppPluginBase } from "../../basic/AppPluginBase";
import { CommandManagerIssuesEvent } from "../event-manager/events";

export class AppCommandManager extends AppPluginBase<null>{
    public onReady(): Promise<void> {
        this.logger.info("command plugin is ready")
        return null;
    }   
    
    public onStart(): Promise<void> {
        this.logger.info("command plugin is starting")
        return null;
    }


    public onClose(): Promise<void> {
        this.logger.info("command plugin is closing")
        return null;
    }

}