export class API {
  apiRoot: string;
  csrfToken: string;

  constructor({ csrfToken }: { csrfToken: string }) {
    this.apiRoot = "/codilla/api/challenge";
    this.csrfToken = csrfToken;
  }

  async markComplete(lesson_id: string, code: string) {
    this.callApi("complete", { code, lesson_id }, { method: "PUT" });
  }

  async reset(lesson_id: string) {
    this.callApi("reset", { lesson_id }, { method: "PUT" });
  }

  async save(lesson_id: string, code: string) {
    await this.callApi("save", { code, lesson_id }, { method: "PUT" });
  }

  private getApiPath(op: string) {
    const pathMap = {
      complete: "/complete",
      reset: "/reset",
      save: "/save",
    };

    return `${this.apiRoot}${pathMap[op]}`;
  }

  private async callApi(
    op: "complete" | "reset" | "save",
    payload: object,
    options: { method?: string },
  ) {
    fetch(this.getApiPath(op), {
      method: options.method || "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": this.csrfToken,
      },
      body: JSON.stringify(payload),
    });
  }
}
