import { bingWebSearch } from "./search";
import { ItemCreateMessage, SessionUpdateMessage, ToolsDefinition } from "rt-client";

export class AssistantService {

    language: string = "English";

    private toolsForGenericAssistants = [
        {
            name: 'get_weather',
            description: 'get the weather of the locaion',
            parameters: {
                type: 'object',
                properties: {
                    location: { type: 'string', description: 'location for the weather' }
                }
            },
            returns: async (_arg: string) => `the weather of ${JSON.parse(_arg).location} is 40F and rainy`
        }, {
            name: 'query_client_master_database',
            description: 'Retrieve the customer information from the Client Master database.',
            parameters: {
                type: 'object',
                properties: {
                    bankCardNumber: { type: 'string', description: 'Bank Account Number' }
                }
            },
            returns: async (_arg: string) => {
                let result = [{
                    Name: "Hanako Azure",
                    Address: "2-16-3 Konan, Minato-ku, Tokyo",
                    Phone : "03-4332-5300",
                }];

                return JSON.stringify(result);
            }
        }, {
            name: 'update_client_master_database',
            description: 'Update the customer information from the Client Master database.',
            parameters: {
                type: 'object',
                properties: {
                    bankCardNumber: { type: 'string', description: 'Bank Account Number' },
                    newName: { type: 'string', description: 'New Name' },
                    newAddress: { type: 'string', description: 'New Address' }
                }
            },
            returns: async (_arg: string) => {
                let result = [{
                    Name: "Hanako Foundry",
                    Address: "1-1-1 Konan, Minato-ku, Tokyo",
                    Phone : "03-4332-5300",
                }];

                return JSON.stringify(result);
            }
        }, {
            name: 'card_reissue_client_master_database',
            description: 'Record the card reissue information in the Client Master database.',
            parameters: {
                type: 'object',
                properties: {
                    cardType: { type: 'string', description: 'Same or New' },
                    PIN: { type: 'string', description: 'Same or New' },
                }
            },
            returns: async (_arg: string) => {
                let result = [{
                    deliveryMethod: "If there are no changes to the card type or PIN, it will be mailed to your home as is.",
                    disposition: "Please discard the old card once the new one arrives.",
                }];

                return JSON.stringify(result);
            }
        }, {
            name: 'before_finalize_change_request',
            description: 'show and check the change request before finalizing it.',
            parameters: {
                type: 'object',
                properties: {
                    finalizeRequest: { type: 'string', description: 'Yes' }
                }
            },
            returns: async (_arg: string) => {
                let result = [{
                    changeRequestForm: "\
| **Procedure**       | **Details of Change**                                        |\
|---------------------|--------------------------------------------------------------|\
| **Address**         | 1-1-1 Konan, Minato-ku                                        |\
| **Name**            | Hanako Foundry                                               |\
| **Card Reissue**    | • No change to card type <br>• No change to PIN <br>• Delivery method: Mail |\
                    ",
                }];

                return JSON.stringify(result);
            }
        }, {
            name: 'Assistant_MobileAssistant',
            description: 'Help user to answer mobile related question, such as billing, contract, etc.',
            parameters: {
                type: 'object',
                properties: {}
            },
            returns: async (_arg: string) => "Assistant_MobileAssistant"
        }, {
            name: 'Assistant_ShopAssistant',
            description: 'Help user to answer shop related question, such as shop location, available time, etc.',
            parameters: {
                type: 'object',
                properties: {}
            },
            returns: async (_arg: string) => "Assistant_ShopAssistant"
        }, {
            name: 'search_generic_information',
            description: 'Use this function when you need to search the generic inforamtion. Do not tell customer the fake billing information before getting result from this function.',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'query' }
                }
            },
            returns: async (_arg: string) => {
                return await bingWebSearch(JSON.parse(_arg).query);
            }
        }];

    private toolsForMobileAssistants = [
        {
            name: 'get_mobile_plans',
            description: 'Mobile phone: Get a list of subscription plans. Do not tell customer the fake inforamtion before getting result from this function.',
            parameters: {
                type: 'object',
                properties: {}
            },
            returns: async (_arg: string) => {
                let result = [{
                    PlanId: 1,
                    Name: "Unlimited Plan",
                    Description: "Basic Fee:52 dollars, Data:Unlimited",
                    BaseFee: 6480,
                    CallFeePer30Seconds: 22,
                    DataUsageLimit: -1,
                    CallUsageLimit: -1,
                    DataFeePerGB: 0,
                    ListSuitedFor: [
                        "Watch video a lot.",
                        "Play games frequently",
                    ]
                },
                {
                    PlanId: 2,
                    Name: "Basic Plan + 4GB",
                    Description: "Basic Fee:10 dollars, Data:4GB",
                    BaseFee: 980,
                    CallFeePer30Seconds: 22,
                    DataUsageLimit: 4,
                    CallUsageLimit: -1,
                    DataFeePerGB: 500,
                    ListSuitedFor: [
                        "Beginner",
                        "Who doesn't use much internet service",
                    ]
                },
                {
                    PlanId: 3,
                    Name: "Basic Plan + 20GB",
                    Description: "Basic Fee:20 dollars, Data:20GB",
                    BaseFee: 2480,
                    CallFeePer30Seconds: 22,
                    DataUsageLimit: 20,
                    CallUsageLimit: -1,
                    DataFeePerGB: 500,
                    ListSuitedFor: [
                        "Beginner",
                        "Who uses more internet service",
                    ]
                }];

                return JSON.stringify(result);
            }
        }, {
            name: 'get_mobile_option_plans',
            description: 'Mobile phone: Get List of Option Plans. Do not tell customer the fake inforamtion before getting result from this function.',
            parameters: {
                type: 'object',
                properties: {}
            },
            returns: async (_arg: string) => {
                let result = [{
                    OptionId: 1,
                    Name: "Basic Warranty Service",
                    Description: "Basic Warranty Service",
                    Fee: "3 dollars",
                },
                {
                    OptionId: 2,
                    Name: "Mobile Security",
                    Description: "Mobile Security",
                    Fee: "4 dollars",
                },
                {
                    OptionId: 3,
                    Name: "PC Security",
                    Description: "PC Security",
                    Fee: "2 dollars",
                },
                {
                    OptionId: 4,
                    Name: "Answering Machine Service",
                    Description: "Answering Machine Service",
                    Fee: "2.5 dollars",
                },
                {
                    OptionId: 5,
                    Name: "GPS Service",
                    Description: "GPS Service",
                    Fee: "1.5 dollars",
                }];

                return JSON.stringify(result);
            }
        }, {
            name: 'get_service_area_failure',
            description: 'Service Area Failure Inquiry: Information on failures occurring in the designated service area. Do not tell customer the fake inforamtion before getting result from this function.',
            parameters: {
                type: 'object',
                properties: {
                    areaName: { type: 'string', description: 'the name of the area' }
                }
            },
            returns: async (_arg: string) => `${JSON.parse(_arg).areaName} has no failure.`
        }, {
            name: 'get_mobile_service_options',
            description: 'mobile phone: Get current options. Do not tell customer the fake inforamtion before getting result from this function.',
            parameters: {
                type: 'object',
                properties: {
                    userId: { type: 'string', description: 'user id' }
                }
            },
            returns: async (_arg: string) => {
                let result = [{
                    Name: "Basic Warranty Service",
                    HasContract: true,
                    NeedRecommendation: false,
                }, {
                    Name: "Mobile Security",
                    HasContract: false,
                    NeedRecommendation: true,
                }, {
                    Name: "PC Security",
                    HasContract: true,
                    NeedRecommendation: false,
                }, {
                    Name: "Answering Machine Service",
                    HasContract: true,
                    NeedRecommendation: true,
                }, {
                    Name: "GPS Service",
                    HasContract: true,
                    NeedRecommendation: false,
                }]

                return JSON.stringify(result);
            }
        }, {
            name: 'get_current_mobile_service_plan',
            description: 'mobile phone: Get current contract/service plan. Do not tell customer the fake plan before getting result from this function.',
            parameters: {
                type: 'object',
                properties: {
                    userId: { type: 'string', description: 'user id' }
                }
            },
            returns: async (_arg: string) => "Basic plan: 40GB internet, 100 minutes call."
        }, {
            name: 'get_mobile_billing',
            description: 'mobile phone: Get billing information. Do not tell customer the fake billing information before getting result from this function.',
            parameters: {
                type: 'object',
                properties: {
                    userId: { type: 'string', description: 'user id' },
                    year: { type: 'number', description: 'year' },
                    month: { type: 'number', description: 'month' }
                }
            },
            returns: async (_arg: string) => {
                let month = 1;
                if (_arg.includes('month')) {
                    month = JSON.parse(_arg).month
                }
                return `total${month.toString()}0 dollars. Call usage: ${month.toString()}0 minutes, internet usage: ${month.toString()}0GB`
            }
        }, {
            name: 'get_mobile_service_unpaid_information',
            description: 'mobile phone: Get current unpaid information. Do not tell customer the fake billing information before getting result from this function.',
            parameters: {
                type: 'object',
                properties: {
                    userId: { type: 'string', description: 'user id' }
                }
            },
            returns: async (_arg: string) => 'nothing due'
        }, {
            name: 'Assistant_GenericAssistant',
            description: 'If customer asks some question that is outside of your work scope, use this to swtich back to the generic assistant.',
            parameters: {
                type: 'object',
                properties: {}
            },
            returns: async (_arg: string) => "Assistant_GenericAssistant"
        }];

    private toolsForShopAssistants = [
        {
            name: 'find_nearby_shops',
            description: 'shop: Find nearby shop of the user.',
            parameters: {
                type: 'object',
                properties: {
                    location: { type: 'string', description: 'location' }
                }
            },
            returns: async (_arg: string) => {
                let result = [{
                    StopId: 1,
                    Name: `${location} east store`,
                    BusinessHour: "Every day 11:00 to 20:00",
                    Services: "Sell phones, Teach the basics of how to use phones",
                },
                {
                    StopId: 2,
                    Name: `${location} west store`,
                    BusinessHour: "Monday to Friday 11:00 to 20:00, Saturday 10:00 to 19:00, Sunday off",
                    Services: "Sell phones",
                }];

                return JSON.stringify(result);
            }
        }, {
            name: 'Assistant_GenericAssistant',
            description: 'If customer asks some question that is outside of your work scope, use this to swtich back to the generic assistant.',
            parameters: {
                type: 'object',
                properties: {}
            },
            returns: async (_arg: string) => "Assistant_GenericAssistant"
        }];

    public getToolsForAssistant(name: string) {
        let toolsDefinitions: ToolsDefinition = [];
        let toolsToLoad: any[] = [];
        if (name === "GenericAssistant") {
            toolsToLoad = this.toolsForGenericAssistants;
        } else if (name === "MobileAssistant") {
            toolsToLoad = this.toolsForMobileAssistants;
        } else if (name === "ShopAssistant") {
            toolsToLoad = this.toolsForShopAssistants;
        }
        toolsToLoad.forEach(tool => {
            toolsDefinitions.push(
                {
                    type: 'function',
                    name: tool.name,
                    parameters: tool.parameters,
                    description: tool.description,
                });
        });
        return toolsDefinitions;
    }

    public async getToolResponse(toolName: string, parameters: string, call_id: string): Promise<ItemCreateMessage | SessionUpdateMessage> {
        let tools = [...this.toolsForMobileAssistants, ...this.toolsForGenericAssistants, ...this.toolsForShopAssistants];
        let content = await tools.find(tool => tool.name === toolName)!.returns(parameters);
        if (content == "Assistant_MobileAssistant") {
            let configMessage: SessionUpdateMessage = {
                type: "session.update",

                session: {
                    turn_detection: {
                        type: "server_vad",
                    }
                }
            };
            let assistant: [systemMessage: string, tools: any[]] = this.createMobileAssistantConfigMessage();
            configMessage.session.instructions = assistant[0];
            configMessage.session.temperature = 0.6;
            configMessage.session.tools = assistant[1];
            return configMessage;
        } else if (content == "Assistant_ShopAssistant") {
            let configMessage: SessionUpdateMessage = {
                type: "session.update",

                session: {
                    turn_detection: {
                        type: "server_vad",
                    }
                }
            };
            let assistant: [systemMessage: string, tools: any[]] = this.createShopAssistantConfigMessage();
            configMessage.session.instructions = assistant[0];
            configMessage.session.temperature = 0.6;
            configMessage.session.tools = assistant[1];
            return configMessage;
        } else if (content == "Assistant_GenericAssistant") {
            let configMessage: SessionUpdateMessage = {
                type: "session.update",

                session: {
                    turn_detection: {
                        type: "server_vad",
                    }
                }
            };
            let assistant: [systemMessage: string, tools: any[]] = this.createGenericAssistantConfigMessage();
            configMessage.session.instructions = assistant[0];
            configMessage.session.temperature = 0.6;
            configMessage.session.tools = assistant[1];
            return configMessage;
        }
        else {
            let response: ItemCreateMessage = {
                type: 'conversation.item.create',
                item: {
                    type: 'function_call_output',
                    call_id: call_id,
                    output: content
                }
            }
            return response;
        }
    }

    public createGenericAssistantConfigMessage(): [systemMessage: string, tools: object[]] {

        const systemMessage: string = `
        ## Role
        You are **"John",** an elite, well-trained conversational agent that supports a bank-branch counter representative.  
        • You speak ${this.language} natively and flawlessly—no foreign accent.  
        • You silently observe the dialogue between the **customer** and the **representative**.  
        • Your mission is to (a) infer the customer's needs, (b) advise the representative on the very next question or action, and (c) trigger a specialized assistant via function calling when deeper expertise is required.

        ## Operating Principles
        1. **Advice Generation**  
        - After each customer utterance, supply the representative with the single most relevant next question or action.

        2. **Client-Master Record Handling**  
        - When the customer provides new or updated personal details, retrieve the corresponding record from *Client Master*.  
        - Display that record simultaneously on the customer’s and representative’s monitors.  
        - Collect any missing information, then update the record and show the revised version to both parties.

        3. **Confirm the Change Request Form**
        At the end of the dialog, you **MUST** show the change record as a Change Request Form to both the representative and the customer.

		| **Procedure**      | **Change request to Confirm**                                         |
		|----------------|---------------------------------------------------------------------------|
		| **Address Change** | New address                                                               |
		| **Name Change**    | New name                                                                  |
		| **Card Reissue**   | • Card-type change? <br>• PIN change? <br>• Delivery method (mail/instant)|

        4. **Tagging Conventions**  
        Prepend one—and only one—of the following tags to every message you output:  
        - ###AdviceToRepresentative###  Guidance meant **only** for the representative.  
        - ###InfoToRepresentative###    Data (e.g., account details) visible only to the representative.  
        - ###InfoToCustomer###          Data or confirmations shown to the customer.

        ## Sample Dialogue Flow (Marriage Scenario): Important notice enclosed in >>>triple backticks<<<.
            Representative: "Welcome. I'm Yamada, and I'll be assisting you today. Thank you for coming."
            Customer: "Thank you. I got married last month and moved, so I'm here to handle the procedures."

            John: "###AdviceToRepresentative### Ask the customer for their new address related to the move. Confirm whether their phone number needs to be changed. Since it's due to marriage, check if a name change is required."
            >>>CHECK PHONE AND NAME CHANGE, TOO<<<

            Representative: "Congratulations on your marriage. You'd like to change your address, correct? Has your phone number changed? And with your marriage, will you need to change the name on your account?"
            Customer: "I believe I registered my mobile number, so it hasn't changed. I also need to update my name."

            John: "
                ###AdviceToRepresentative### A name change also requires reissuing the cash card. Based on this, the following procedures are necessary:
                1. Address change
                2. Name change
                3. Card reissue 
                "
            >>> ASK FOR BANK ACCOUNT NUMBER BEFORE YOU SHOW THE CLIENT MASTER RECORD <<<

            Representative: "Understood. Since your name is changing, we'll process a reissue of your cash card as well. To confirm your registration details, please tell me your bank account number."
            Customer: "It's 2311555."

            John: "###InfoToRepresentative###
                Name: Ms. Resona Tanaka
                Address: 1-5-8 Kiba, Koto-ku, Tokyo
                Phone: 080-1234-5678

                Today's procedures:

                1. Address change
                2. Name change
                3. Card reissue
                "

            John: "###InfoToCustomer###
                Name: Ms. Resona Tanaka
                Address: 1-5-8 Kiba, Koto-ku, Tokyo
                Phone: 080-1234-5678

                Today's procedures:

                1. Address change
                2. Name change
                3. Card reissue 
                " 
            >>> BE SURE TO SHOW THE CLIENT MASTER RECORD TO THE CUSTOMER, TOO <<<

            Representative: "Please tell me your new name."
            Customer: "My new name is Resona Sato."

            Representative: "Please tell me your new address."
            Customer: "It's Kiwi Heights 305, 1-1-1 Kire, Hirano-ku, Osaka."

            John: "###AdviceToRepresentative### Please verify the new address and name with one of the following documents:
                • DRIVER'S LICENSE
                • HEALTH INSURANCE CARD
                " 
            >>> BE SURE TO ASK THE CUSTOMER TO SHOW THE DRIVER'S LICENSE CARD <<<

            Representative: "Thank you. To confirm, please present your driver's license or health insurance card."
            Customer: "Here is my driver's license."

            John: "###AdviceToRepresentative### Driver's license confirmed."
            John: "###AdviceToRepresentative### Ask whether they want to change the card type or PIN for the reissued card; if there are no changes, inform them that the new card will be mailed as is to their home, and they can continue using their current card until the new one arrives." 
            >>> BE SURE TO ASK THE CUSTOMER FOR CONFIRMATION BEFORE PROCEEDING WITH THE REISSUE <<<

            Representative: "Is it okay to keep the same card type and PIN?" 
            Customer: "That's fine."
            Representative: "Then we'll mail it to your home without any changes. When the new card arrives, please destroy the old one."
            Customer: "Understood."

            John: "###InfoToRepresentative###
                After update:
                Name: Ms. Resona Sato
                Address: Kiwi Heights 305, 1-1-1 Kire, Hirano-ku, Osaka
                Phone: 080-1234-5678 
                "

            John: "###InfoToCustomer###
                After update:
                Name: Ms. Resona Sato
                Address: Kiwi Heights 305, 1-1-1 Kire, Hirano-ku, Osaka
                Phone: 080-1234-5678
                "
            >>> BE SURE TO SHOW THE UPDATED CLIENT MASTER RECORD TO THE CUSTOMER, TOO <<<

            John: "###AdviceToRepresentative### Let's have the customer confirm the Change Request Form"
            >>> NOW LET'S SHOW THE CHANGE REQUEST FORM <<<
            John: "###InfoToRepresentative###

                | **Procedure**      | **Change request to Confirm**                                       |
                |----------------|-------------------------------------------------------------------------|
                | **Address Change** | Kiwi Heights 305, 1-1-1 Kire, Hirano-ku, Osaka                          |
                | **Name Change**    | Ms. Resona Sato                                                         |
                | **Card Reissue**   | • Card-type: No change <br>• PIN: No change <br>• Delivery method: Mail |
                "
            >>> BE SURE TO SHOW THE CHANGE REQUEST FORM TO THE REPRESENTATIVE <<<
            
            John: "###InfoToCustomer###

                | **Procedure**      | **Change request to Confirm**                                       |
                |----------------|-------------------------------------------------------------------------|
                | **Address Change** | Kiwi Heights 305, 1-1-1 Kire, Hirano-ku, Osaka                          |
                | **Name Change**    | Ms. Resona Sato                                                         |
                | **Card Reissue**   | • Card-type: No change <br>• PIN: No change <br>• Delivery method: Mail |
                "
            >>> BE SURE TO SHOW THE CHANGE REQUEST FORM TO THE CUSTOMER, TOO <<<
    
            Representative: "Please confirm the summary of changes, then push the OK button to proceed."
            Customer: "I have confirmed and pushed the OK button."
            >>>BE SURE TO ASK FOR OK BUTTON AND WAIT FOR THE CUSTOMER TO DO IT.<<<

            John: "###AdviceToRepresentative### Thank you for your hard work! Reception is complete. Let's see the customer out."
            >>> DOUBLE CHECK IF YOU SHOWED THE CHANGE REQUEST FORM BEFORE THIS STEP <<<
            Representative: "Reception is complete. That concludes today's procedures. Please make sure you haven't left anything behind. Thank you very much."

        
        ## CAUTION!
        - Never add any information to customer display that is not in the client master record and the Change Request Form.
        - Never refer to name change before the customer ask to do so.
        - Never show any information before you get the bank account number.
        - Output **only** in ${this.language}.
        `;

        return [systemMessage, this.getToolsForAssistant("GenericAssistant")];
    }


    public createMobileAssistantConfigMessage(): [systemMessage: string, tools: object[]] {

        const systemMessage: string = `
        ## Role
        You are an expert, well-training agent for support center.
        You are a native speaker of ${this.language} without any accents.
        You are responsible for supporting customers with their mobile phone contracted related questions such as billing, getting contract, explain plans, etc.
        All the other unrelated questions should be switched to the generic assistant by using function calling.
        Introduce yourself as "Mike".

        ## Rules
        - You MUST use function calling to get the information before you answers to the customer for their mobile service related query.
        - You are in a call with customer. Please provide userful information.
        - If the customer is not satisfied with your answer, you can ask the customer to repeat the question or ask the customer to wait for a while.
        - When the service plan name or option names are not easy to understand, please rephrase them so that the customer can understand them easily. For example, ""Answering machine plus (with transfer)"" is ""Answering machine"".
        - Reply in ${this.language}
        - You MUST follow the following restrictions

        ## Restrictions
        - You DO NOT need any customer identification information as they already have been verified by the system.
        - DO NOT let the customer wait as you cannot push the answer later.`;

        return [systemMessage, this.getToolsForAssistant("MobileAssistant")];
    }

    public createShopAssistantConfigMessage(): [systemMessage: string, tools: object[]] {

        const systemMessage: string = `
        ##Role
        You are an expert, well-training agent for support center.
        You are a native speaker of ${this.language} without any accents.
        You are responsible for supporting customers to identify their needs for any mobile phone shop related question.
        All the other unrelated questions should be switched to the generic assistant by using function calling.
        Introduce yourself as "Andy".

        ##Rules
        - You are in a call with customer. Please provide userful information.
        - When cutomer provides information you ask, add an appreciation message to your reply.
        - If the customer is not satisfied with your answer, you can ask the customer to repeat the question or ask the customer to wait for a while.
        - Reply in ${this.language}
        - You MUST follow the following restrictions

        ##Restrictions
        - You DO NOT need any customer identification information as they already have been verified by the system.
        - DO NOT let the customer wait as you cannot push the answer later.`;

        return [systemMessage, this.getToolsForAssistant("ShopAssistant")];
    }
}