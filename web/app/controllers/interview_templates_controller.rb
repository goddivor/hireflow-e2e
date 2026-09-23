class InterviewTemplatesController < ApplicationController
  before_action :require_user
  before_action :require_staff
  before_action :set_template, only: %i[edit update destroy]

  def index
    @templates = current_organization.interview_templates.order(:title)
  end

  def new
    @template = current_organization.interview_templates.new(questions: [""])
  end

  def create
    @template = current_organization.interview_templates.new(template_params)
    if @template.save
      redirect_to org_interview_templates_path, notice: "Template \"#{@template.title}\" was created."
    else
      render :new, status: :unprocessable_content
    end
  end

  def edit
  end

  def update
    if @template.update(template_params)
      redirect_to org_interview_templates_path, notice: "Template \"#{@template.title}\" was updated."
    else
      render :edit, status: :unprocessable_content
    end
  end

  def destroy
    if @template.destroy
      redirect_to org_interview_templates_path, notice: "Template \"#{@template.title}\" was deleted."
    else
      redirect_to org_interview_templates_path, alert: "\"#{@template.title}\" has invitations and cannot be deleted."
    end
  end

  private

  # Scoped lookup: another tenant's template id answers 404, exactly like an id that does not exist.
  def set_template
    @template = current_organization.interview_templates.find(params[:id])
  end

  def template_params
    params.expect(interview_template: [:title, questions: []])
  end
end
